import { BUSINESS_FIELDS, BUSINESS } from "@/lib/site";

/**
 * 사업자 정보 블록 (라이트 배경용).
 * 약관/개인정보/환불/프리미엄/로그인 등 본문에 공통으로 끼워 넣는다.
 * 값은 전부 lib/site.ts(BUSINESS) 단일 출처에서 가져온다.
 */
export function BusinessInfo({
  title = "사업자 정보",
  className = "",
}: {
  title?: string | null;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-hairline bg-surface-soft p-5 text-sm ${className}`}
    >
      {title && (
        <h3 className="font-semibold text-ink mb-3 text-sm">{title}</h3>
      )}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {BUSINESS_FIELDS.map((f) => (
          <div key={f.label} className="flex gap-2">
            <dt className="text-muted shrink-0 w-24">{f.label}</dt>
            <dd className="text-body break-all">
              {f.label === "이메일" ? (
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="text-primary hover:underline"
                >
                  {f.value}
                </a>
              ) : f.label === "전화번호" ? (
                <a href={`tel:${BUSINESS.tel}`} className="hover:underline">
                  {f.value}
                </a>
              ) : (
                f.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
