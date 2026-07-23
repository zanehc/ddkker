"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EmailPasswordLoginForm({ next = "/" }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("이메일 또는 비밀번호를 확인해 주세요.");
      return;
    }

    const safeNext = next.startsWith("/") ? next : "/";
    router.replace(safeNext);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-muted mb-1.5">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full h-12 rounded-md border border-hairline bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted-soft focus:border-primary"
          placeholder="admin@ddkker.com"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-medium text-muted mb-1.5">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full h-12 rounded-md border border-hairline bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted-soft focus:border-primary"
          placeholder="비밀번호"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-active disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "로그인 중..." : "이메일로 로그인"}
      </button>

      {error && <p className="text-xs leading-snug text-red-600">{error}</p>}
    </form>
  );
}
