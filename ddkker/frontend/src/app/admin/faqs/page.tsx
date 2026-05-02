import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export const metadata = { title: "FAQ 관리" };

async function createFaq(formData: FormData) {
  "use server";
  await requireAdmin();

  const question = formData.get("question") as string;
  const answer = formData.get("answer") as string;
  const category = formData.get("category") as string;
  const sortOrder = parseInt(formData.get("sort_order") as string || "0", 10);

  if (!question?.trim() || !answer?.trim()) return;

  const { error } = await adminClient.from("faqs").insert({
    question: question.trim(),
    answer: answer.trim(),
    category: category || null,
    sort_order: sortOrder,
    published: true,
  });

  if (!error) {
    await adminClient.rpc("log_admin_action", {
      p_action: "faq_created",
      p_table: "faqs",
      p_meta: { question: question.substring(0, 50) },
    });
    revalidatePath("/admin/faqs");
    revalidatePath("/faq");
  }
}

async function toggleFaqPublished(faqId: number, currentValue: boolean) {
  "use server";
  await requireAdmin();
  await adminClient
    .from("faqs")
    .update({ published: !currentValue })
    .eq("id", faqId);
  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
}

async function updateFaqOrderAction(faqId: number, formData: FormData) {
  "use server";
  await requireAdmin();
  const newOrder = parseInt((formData.get("new_order") as string) || "0", 10);
  await adminClient
    .from("faqs")
    .update({ sort_order: newOrder })
    .eq("id", faqId);
  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
}

export default async function AdminFaqsPage() {
  await requireAdmin();

  const { data: faqs } = await adminClient
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-display-md font-serif text-ink mb-8">FAQ 관리</h1>

      {/* FAQ 등록 폼 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6 mb-8">
        <h2 className="text-title-md font-semibold text-ink mb-4">새 FAQ 등록</h2>
        <form action={createFaq} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">질문 *</label>
            <input name="question" type="text" required
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="자주 묻는 질문을 입력하세요" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">답변 *</label>
            <textarea name="answer" rows={3} required
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="답변을 입력하세요" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">카테고리</label>
              <select name="category"
                className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none">
                <option value="">선택 안함</option>
                <option value="enrollment">수강 신청</option>
                <option value="membership">멤버십</option>
                <option value="content">강의 내용</option>
                <option value="technical">기술 문의</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">정렬 순서</label>
              <input name="sort_order" type="number" defaultValue={0}
                className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit"
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-active transition-colors">
              FAQ 등록
            </button>
          </div>
        </form>
      </section>

      {/* FAQ 목록 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6">
        <h2 className="text-title-md font-semibold text-ink mb-4">
          FAQ 목록 ({faqs?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {(faqs ?? []).map((faq) => (
            <div key={faq.id} className="border border-hairline rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink mb-1">{faq.question}</p>
                  <p className="text-xs text-muted line-clamp-2">{faq.answer}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {faq.category && (
                      <span className="text-xs text-muted bg-surface-soft px-2 py-0.5 rounded-pill">
                        {faq.category}
                      </span>
                    )}
                    <span className="text-xs text-muted">순서: {faq.sort_order}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* 정렬 순서 수정 */}
                  <form action={updateFaqOrderAction.bind(null, faq.id)} className="flex items-center gap-1">
                    <input name="new_order" type="number" defaultValue={faq.sort_order}
                      className="w-16 px-2 py-1 border border-hairline rounded text-xs text-ink bg-canvas focus:outline-none"
                    />
                    <button type="submit"
                      className="text-xs text-primary hover:underline">
                      저장
                    </button>
                  </form>
                  {/* 공개/비공개 토글 */}
                  <form action={toggleFaqPublished.bind(null, faq.id, faq.published)}>
                    <button type="submit"
                      className={`px-3 py-1 rounded-pill text-xs font-semibold transition-colors ${
                        faq.published
                          ? "bg-success/10 text-success hover:bg-red-100 hover:text-red-600"
                          : "bg-surface-card text-muted hover:bg-success/10 hover:text-success"
                      }`}>
                      {faq.published ? "공개" : "비공개"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
