#!/bin/bash
# Oracle Cloud ARM VM (Ubuntu 22.04) 초기 세팅
# sudo ./scripts/setup_oracle.sh

set -euo pipefail

BOT_USER="ubuntu"
BOT_DIR="/opt/ddkkbot"

echo "=== [1/9] 패키지 업데이트 ==="
apt-get update -y && apt-get upgrade -y
apt-get install -y python3.11 python3.11-venv python3-pip git curl wget unzip

echo "=== [2/9] Node.js (nvm) 설치 ==="
sudo -u "$BOT_USER" bash -c '
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  source "$NVM_DIR/nvm.sh"
  nvm install --lts
  node --version
  npm --version
'

echo "=== [3/9] npm 글로벌 경로 설정 ==="
sudo -u "$BOT_USER" bash -c '
  mkdir -p ~/.npm-global
  npm config set prefix ~/.npm-global
  echo "export PATH=~/.npm-global/bin:$PATH" >> ~/.bashrc
'

echo "=== [4/9] Claude Code + Codex CLI 설치 ==="
sudo -u "$BOT_USER" bash -c '
  export PATH="$HOME/.npm-global/bin:$PATH"
  npm install -g @anthropic-ai/claude-code
  npm install -g @openai/codex
  echo "설치 완료. 아래 명령으로 각각 로그인 필요:"
  echo "  claude login"
  echo "  codex login"
'

echo "=== [5/9] 봇 디렉토리 준비 ==="
mkdir -p "$BOT_DIR/logs"
chown -R "$BOT_USER":"$BOT_USER" "$BOT_DIR"

echo "=== [6/9] 코드 복사 (이 단계에서 /opt/ddkkbot에 worker.py 등이 있어야 함) ==="
echo "git clone 또는 scp로 봇 코드를 $BOT_DIR 에 복사하고 아래를 실행하세요:"
echo "  sudo -u ubuntu bash -c 'cd $BOT_DIR && cp .env.example .env && nano .env'"

echo "=== [7/9] Python 가상환경 ==="
sudo -u "$BOT_USER" bash -c "
  python3.11 -m venv $BOT_DIR/.venv
  $BOT_DIR/.venv/bin/pip install -r $BOT_DIR/requirements.txt
"

echo "=== [8/9] Oracle Cloud 방화벽 (iptables) ==="
# Oracle Cloud VM의 기본 iptables는 인바운드를 모두 차단
# 봇은 아웃바운드만 필요 (Supabase, Telegram, R2, Claude/Codex API)
# 인바운드는 기본값 유지 (SSH 22만 허용)
echo "아웃바운드는 기본 허용. 인바운드 추가 열기 불필요 (봇은 아웃바운드만 사용)."

echo "=== [9/9] systemd 서비스 등록 ==="
cp "$BOT_DIR/systemd/ddkkbot.service" /etc/systemd/system/ddkkbot.service
systemctl daemon-reload
systemctl enable ddkkbot
echo ""
echo "✅ 세팅 완료."
echo "   .env 파일 설정 후 'systemctl start ddkkbot' 실행"
echo "   상태 확인: systemctl status ddkkbot"
echo "   로그 확인: journalctl -u ddkkbot -f"
