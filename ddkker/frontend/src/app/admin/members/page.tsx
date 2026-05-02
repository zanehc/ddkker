import { requireAdmin } from "@/lib/server/authz";
import { adminClient } from "@/lib/server/admin-client";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export const metadata = { title: "멤버십 관리" };

async function grantMembership(formData: FormData) {
  "use server";
  await requireAdmin();

  const userId = formData.get("user_id") as string;
  const tier = formData.get("tier") as string;
  const expiresAt = formData.get("expires_at") as string;
  const note = formData.get("note") as string;

  if (!userId?.trim() || !tier) return;

  // 기존 활성 멤버십이 있으면 만료 처리
  await adminClient
    .from("memberships")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active");

  const { error } = await adminClient.from("memberships").insert({
    user_id: userId.trim(),
    tier,
    status: "active",
    source: "manual",
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    note: note?.trim() || null,
  });

  if (!error) {
    await adminClient.rpc("log_admin_action", {
      p_action: "membership_granted",
      p_table: "memberships",
      p_target_id: userId,
      p_meta: { tier, note },
    });
    revalidatePath("/admin/members");
  }
}

async function revokeMembership(membershipId: number, userId: string) {
  "use server";
  await requireAdmin();

  await adminClient
    .from("memberships")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("id", membershipId);

  await adminClient.rpc("log_admin_action", {
    p_action: "membership_revoked",
    p_table: "memberships",
    p_target_id: String(membershipId),
    p_meta: { user_id: userId },
  });

  revalidatePath("/admin/members");
}

type MembershipWithProfile = {
  id: number;
  user_id: string;
  tier: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  source: string;
  note: string | null;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export default async function AdminMembersPage() {
  await requireAdmin();

  const { data: memberships } = await adminClient
    .from("memberships")
    .select("*, profiles(display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(100);

  const typedMemberships = (memberships ?? []) as unknown as MembershipWithProfile[];

  return (
    <div>
      <h1 className="text-display-md font-serif text-ink mb-8">멤버십 관리</h1>

      {/* 멤버십 부여 폼 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6 mb-8">
        <h2 className="text-title-md font-semibold text-ink mb-4">멤버십 수동 부여</h2>
        <p className="text-xs text-muted mb-4">
          Supabase 대시보드에서 사용자의 UUID를 확인하세요.
        </p>
        <form action={grantMembership} className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted mb-1">사용자 UUID *</label>
            <input name="user_id" type="text" required
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink font-mono bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">티어 *</label>
            <select name="tier" required
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none">
              <option value="premium">프리미엄</option>
              <option value="annual">연간</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">만료일 (미입력 시 영구)</label>
            <input name="expires_at" type="date"
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted mb-1">메모</label>
            <input name="note" type="text"
              className="w-full px-3 py-2 border border-hairline rounded-lg text-sm text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="부여 사유 메모" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit"
              className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-active transition-colors">
              멤버십 부여
            </button>
          </div>
        </form>
      </section>

      {/* 멤버십 목록 */}
      <section className="bg-canvas border border-hairline rounded-xl p-6">
        <h2 className="text-title-md font-semibold text-ink mb-4">
          멤버십 목록 ({typedMemberships.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-muted">
                <th className="pb-3 pr-4">사용자</th>
                <th className="pb-3 pr-4">티어</th>
                <th className="pb-3 pr-4">상태</th>
                <th className="pb-3 pr-4">만료일</th>
                <th className="pb-3 pr-4">출처</th>
                <th className="pb-3">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {typedMemberships.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 pr-4">
                    <div>
                      <p className="font-medium text-ink">
                        {m.profiles?.display_name ?? "이름 없음"}
                      </p>
                      <p className="text-xs text-muted font-mono">{m.user_id.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded-pill text-xs font-semibold uppercase bg-primary/10 text-primary">
                      {m.tier}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-pill text-xs font-semibold uppercase ${
                      m.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-surface-card text-muted"
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted text-xs">
                    {m.expires_at
                      ? new Date(m.expires_at).toLocaleDateString("ko-KR")
                      : "영구"}
                  </td>
                  <td className="py-3 pr-4 text-muted text-xs">{m.source}</td>
                  <td className="py-3">
                    {m.status === "active" && (
                      <form action={revokeMembership.bind(null, m.id, m.user_id)}>
                        <button type="submit"
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                          취소
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
