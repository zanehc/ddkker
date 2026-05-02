"""
ddkkbot 사이트 연동 워커
Supabase bot_tasks 테이블을 큐로 사용 (krc_worker.py 패턴 기반)
"""
import os, sys, json, time, subprocess, re, uuid, hashlib, logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client, Client
import boto3
from botocore.config import Config
import requests  # Telegram 알림용

# ── 설정 ──────────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CLAUDE_CLI   = os.environ.get("CLAUDE_CLI", "claude")
CODEX_CLI    = os.environ.get("CODEX_CLI", "codex")
WORKER_ID    = os.environ.get("WORKER_ID", f"worker-{uuid.uuid4().hex[:8]}")
POLL_SEC     = int(os.environ.get("WORKER_POLL_INTERVAL_SEC", "60"))
HB_SEC       = int(os.environ.get("WORKER_HEARTBEAT_INTERVAL_SEC", "30"))

R2_ACCOUNT   = os.environ["R2_ACCOUNT_ID"]
R2_KEY       = os.environ["R2_ACCESS_KEY_ID"]
R2_SECRET    = os.environ["R2_SECRET_ACCESS_KEY"]
R2_BUCKET    = os.environ["R2_BUCKET_NAME"]
R2_PUBLIC    = os.environ.get("R2_PUBLIC_BASE_URL", "")

TG_TOKEN     = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TG_CHAT      = os.environ.get("TELEGRAM_ALERT_CHAT_ID", "")

WORK_DIR     = Path(__file__).parent

# ── 로깅 ──────────────────────────────────────────────────────────────────────

(WORK_DIR / "logs").mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(WORK_DIR / "logs" / "worker.log", encoding="utf-8"),
    ]
)
log = logging.getLogger("ddkkbot")

db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TASK_CONCURRENCY = {
    "thumbnail":    1,
    "qa-assist":    2,
    "notification": 3,
}

# ── AI 실행 헬퍼 ──────────────────────────────────────────────────────────────

def run_claude(prompt: str, timeout: int = 180) -> str:
    result = subprocess.run(
        [CLAUDE_CLI, "-p", prompt, "--output-format", "text"],
        capture_output=True, text=True, timeout=timeout,
        stdin=subprocess.DEVNULL, cwd=str(WORK_DIR),
    )
    if result.returncode != 0:
        raise RuntimeError(f"Claude 실패: {result.stderr[:300]}")
    return result.stdout.strip()


def run_codex(prompt: str, timeout: int = 600) -> str:
    result = subprocess.run(
        [CODEX_CLI, "exec", "--sandbox", "workspace-write",
         "--skip-git-repo-check", prompt],
        capture_output=True, text=True, timeout=timeout,
        stdin=subprocess.DEVNULL, cwd=str(WORK_DIR),
    )
    if result.returncode != 0:
        raise RuntimeError(f"Codex 실패: {result.stderr[:300]}")
    return result.stdout.strip()


def upload_r2(file_path: str, object_key: str, content_type: str = "image/png") -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_KEY,
        aws_secret_access_key=R2_SECRET,
        config=Config(signature_version="s3v4", region_name="auto"),
    )
    s3.upload_file(file_path, R2_BUCKET, object_key,
                   ExtraArgs={"ContentType": content_type})
    return object_key


def extract_json(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("JSON을 찾을 수 없음")


def send_telegram_alert(message: str):
    """실패 등 운영 알림을 Telegram으로 전송 (002.DDKKBOT 패턴)"""
    if not TG_TOKEN or not TG_CHAT:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
            json={"chat_id": TG_CHAT, "text": f"[ddkkbot] {message}"},
            timeout=5,
        )
    except Exception:
        pass

# ── 태스크 핸들러 ─────────────────────────────────────────────────────────────

def handle_thumbnail(task: dict) -> dict:
    """Codex $Imagegen으로 강의 썸네일 생성 → R2 업로드 → courses 테이블 업데이트"""
    payload   = task["payload"] or {}
    title     = payload.get("title", "강의 썸네일")
    course_id = payload.get("course_id")

    image_path = f"/tmp/thumbnail_{course_id}_{task['id']}.png"
    run_codex(f"""
$Imagegen 아래 강의의 썸네일 이미지를 만들어줘.
생성된 이미지를 {image_path} 에 저장해.

강의 제목: {title}
스타일: 모던 테크 스타일. 인디고(#5B4FD9)와 크림(#faf9f5) 컬러.
       상단에 강의 제목을 한국어로 크게 표시. 우측 하단에 작은 ▌ 아이콘.
크기: 1280x720 (16:9).
""")

    object_key = f"thumbnails/course_{course_id}.png"
    upload_r2(image_path, object_key)

    thumbnail_url = f"{R2_PUBLIC}/{object_key}" if R2_PUBLIC else object_key
    db.table("courses").update({"thumbnail_url": thumbnail_url}) \
      .eq("id", course_id).execute()

    log.info(f"썸네일 생성 완료: course_id={course_id}")
    return {"thumbnail_url": thumbnail_url}


def handle_qa_assist(task: dict) -> dict:
    """Claude CLI로 Q&A 게시글 AI 답변 초안 생성 → 댓글로 등록"""
    payload  = task["payload"] or {}
    post_id  = payload.get("post_id")
    question = f"{payload.get('title','')}\n\n{payload.get('content','')}"

    answer = run_claude(f"""
다음 바이브코딩/SaaS 관련 질문에 한국어로 답변해줘.
답변은 명확하고 실용적으로, 코드가 필요하면 코드블록으로 작성해.
확실하지 않은 내용은 "확인이 필요합니다"라고 명시해.

질문:
{question}
""")

    # 봇 계정 profiles row가 있어야 함 (setup 시 수동 생성)
    bot_user_id = os.environ.get("BOT_USER_ID")
    if bot_user_id:
        db.table("comments").insert({
            "post_id": post_id,
            "user_id": bot_user_id,
            "content": f"🤖 AI 답변 초안:\n\n{answer}",
        }).execute()

    return {"answer_preview": answer[:200]}


HANDLERS = {
    "thumbnail": handle_thumbnail,
    "qa-assist": handle_qa_assist,
}

# ── 큐 폴링 ───────────────────────────────────────────────────────────────────

def claim_task() -> dict | None:
    """atomic claim (FOR UPDATE SKIP LOCKED RPC)"""
    result = db.rpc("claim_bot_task", {"p_worker_id": WORKER_ID}).execute()
    rows = result.data
    return rows[0] if rows else None


def complete_task(task_id: int, result: dict):
    db.table("bot_tasks").update({
        "status": "done",
        "result": result,
    }).eq("id", task_id).execute()


def fail_task(task_id: int, error: str, attempts: int, max_attempts: int):
    if attempts < max_attempts:
        db.table("bot_tasks").update({
            "status": "pending",
            "error": error,
            "worker_id": None,
            "claimed_at": None,
        }).eq("id", task_id).execute()
    else:
        db.table("bot_tasks").update({
            "status": "failed",
            "error": error,
        }).eq("id", task_id).execute()
        send_telegram_alert(f"태스크 최종 실패 task_id={task_id}: {error[:100]}")


def update_heartbeat(task_id: int):
    db.table("bot_tasks").update({"heartbeat_at": "now()"}).eq("id", task_id).execute()


def run_one_task():
    task = claim_task()
    if not task:
        return False

    task_id   = task["id"]
    task_type = task["task_type"]
    handler   = HANDLERS.get(task_type)

    if not handler:
        fail_task(task_id, f"알 수 없는 task_type: {task_type}", task["attempts"], task["max_attempts"])
        return True

    try:
        result = handler(task)
        complete_task(task_id, result)
        log.info(f"✓ task {task_id} ({task_type}) 완료")
    except Exception as e:
        err = str(e)[:500]
        log.error(f"✗ task {task_id} ({task_type}) 실패: {err}")
        fail_task(task_id, err, task["attempts"], task["max_attempts"])

    return True


def main():
    (WORK_DIR / "logs").mkdir(exist_ok=True)
    log.info(f"ddkkbot worker 시작 — id={WORKER_ID}, poll={POLL_SEC}s")

    consecutive_errors = 0

    while True:
        try:
            processed = run_one_task()
            consecutive_errors = 0
            if processed:
                continue   # 처리 건수 있으면 즉시 다음 사이클
        except Exception as e:
            consecutive_errors += 1
            log.error(f"워커 오류 ({consecutive_errors}회 연속): {e}")
            if consecutive_errors >= 5:
                send_telegram_alert(f"워커 연속 오류 {consecutive_errors}회: {e}")

        time.sleep(POLL_SEC)


if __name__ == "__main__":
    main()
