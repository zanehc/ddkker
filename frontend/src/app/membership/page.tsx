import { redirect } from "next/navigation";

// 멤버십(구독) 모델은 프리미엄(강의별 개별 구매)으로 전환되었다.
// 기존 /membership 링크는 모두 /premium 으로 영구 이동한다.
export default function MembershipPage() {
  redirect("/premium");
}
