"use client";

import { useState } from "react";
import type { Faq } from "@/types";

interface FaqAccordionProps {
  faqs: Faq[];
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (faqs.length === 0) {
    return (
      <p className="text-muted text-center py-12">
        등록된 FAQ가 없습니다.
      </p>
    );
  }

  return (
    <div className="divide-y divide-hairline">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;

        return (
          <div key={faq.id} className="py-1">
            <button
              className="w-full text-left py-5 flex items-start justify-between gap-4 group"
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              aria-expanded={isOpen}
            >
              <span className="text-title-md font-medium text-ink group-hover:text-primary transition-colors">
                {faq.question}
              </span>
              <span
                className={`flex-shrink-0 w-6 h-6 rounded-full border border-hairline flex items-center justify-center text-muted transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 4L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div className="pb-5 pr-10">
                <p className="text-body leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
