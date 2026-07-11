"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  BUDGET_RANGES,
  BUDGET_RANGE_LABELS,
  SOURCES,
  SOURCE_LABELS,
} from "@/lib/inquiry";
import type { ProjectType, BudgetRange, InquirySource } from "@/types";

const inputCls =
  "w-full px-4 py-3 border border-hairline rounded-xl bg-canvas text-ink placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";
const labelCls = "block text-sm font-medium text-ink mb-2";

type Props = {
  initialName: string;
  initialEmail: string;
  initialSource: InquirySource;
};

export function InquiryForm({ initialName, initialEmail, initialSource }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("web");
  const [budgetRange, setBudgetRange] = useState<BudgetRange | "">("");
  const [timeline, setTimeline] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState(initialName);
  const [contactEmail, setContactEmail] = useState(initialEmail);
  const [contactPhone, setContactPhone] = useState("");
  const [source, setSource] = useState<InquirySource>(initialSource);
  const [privacyAck, setPrivacyAck] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    if (!privacyAck) {
      setError("개인정보 수집·이용에 동의해야 접수할 수 있습니다.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          projectType,
          budgetRange: budgetRange || null,
          timeline,
          contactName,
          contactEmail,
          contactPhone,
          source,
          privacyAck,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/login?next=${encodeURIComponent(`/outsourcing/new?source=${source}`)}`);
          return;
        }
        setError(data.error ?? "접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      setDone(true);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <main className="bg-canvas min-h-screen">
        <div className="max-w-[640px] mx-auto px-6 py-24 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-display-sm font-bold text-ink mb-3">의뢰가 접수되었습니다</h1>
          <p className="text-muted text-sm leading-relaxed mb-8">
            담당자가 내용을 확인한 뒤 입력하신 이메일로 연락드리겠습니다.<br />
            빠른 시일 내에 상담을 도와드리겠습니다.
          </p>
          <div className="flex gap-3 justify-center">
            <Button href="/" variant="secondary">홈으로</Button>
            <Button href="/outsourcing" variant="primary">외주 안내 보기</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-canvas min-h-screen">
      <div className="max-w-[800px] mx-auto px-6 py-16">
        <div className="mb-8">
          <Link
            href="/outsourcing"
            className="text-sm text-muted hover:text-primary transition-colors mb-4 inline-block"
          >
            ← 외주 안내로 돌아가기
          </Link>
          <h1 className="text-display-md font-bold text-ink">외주 의뢰 접수</h1>
          <p className="text-muted text-sm mt-2">
            프로젝트 내용을 남겨주시면 검토 후 연락드립니다. (* 필수)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div>
            <label htmlFor="title" className={labelCls}>
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 예약 기능이 있는 소개 웹사이트 제작"
              className={inputCls}
              maxLength={200}
              required
            />
          </div>

          {/* 프로젝트 유형 + 예산 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="projectType" className={labelCls}>
                프로젝트 유형 <span className="text-red-500">*</span>
              </label>
              <select
                id="projectType"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className={inputCls}
                required
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PROJECT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="budgetRange" className={labelCls}>
                예산 범위
              </label>
              <select
                id="budgetRange"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value as BudgetRange | "")}
                className={inputCls}
              >
                <option value="">선택 안 함 / 협의</option>
                {BUDGET_RANGES.map((b) => (
                  <option key={b} value={b}>
                    {BUDGET_RANGE_LABELS[b]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 희망 일정 */}
          <div>
            <label htmlFor="timeline" className={labelCls}>
              희망 일정
            </label>
            <input
              id="timeline"
              type="text"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="예: 2주 이내 / 협의 가능"
              className={inputCls}
              maxLength={100}
            />
          </div>

          {/* 상세 내용 */}
          <div>
            <label htmlFor="description" className={labelCls}>
              상세 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="필요한 기능, 참고 사이트, 현재 상황 등을 자유롭게 적어주세요."
              className={`${inputCls} resize-none`}
              rows={8}
              maxLength={5000}
              required
            />
            <p className="text-xs text-muted mt-1 text-right">{description.length}/5000</p>
          </div>

          {/* 연락처 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contactName" className={labelCls}>
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="contactName"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="성함 또는 회사명"
                className={inputCls}
                maxLength={50}
                required
              />
            </div>
            <div>
              <label htmlFor="contactPhone" className={labelCls}>
                연락처 (선택)
              </label>
              <input
                id="contactPhone"
                type="tel"
                inputMode="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="010-0000-0000"
                className={inputCls}
                maxLength={20}
              />
            </div>
          </div>
          <div>
            <label htmlFor="contactEmail" className={labelCls}>
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="연락받을 이메일"
              className={inputCls}
              maxLength={200}
              required
            />
          </div>

          {/* 유입경로 */}
          <div>
            <label htmlFor="source" className={labelCls}>
              어떻게 오셨나요?
            </label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value as InquirySource)}
              className={inputCls}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* 개인정보 동의 */}
          <div className="bg-surface-soft border border-hairline rounded-xl px-4 py-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAck}
                onChange={(e) => setPrivacyAck(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="text-sm text-ink leading-relaxed">
                <span className="font-medium">[필수]</span> 상담을 위한 개인정보(이름·이메일·연락처·의뢰 내용) 수집·이용에 동의합니다.
                수집한 정보는 상담·계약 목적에 한해 이용되며, 목적 달성 후 관련 법령에 따라 보관 후 파기됩니다.{" "}
                <Link href="/privacy" className="underline hover:text-primary" target="_blank">
                  개인정보처리방침
                </Link>
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !title.trim() || !description.trim() || !privacyAck}
            >
              {isLoading ? "접수 중..." : "의뢰 접수하기"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
