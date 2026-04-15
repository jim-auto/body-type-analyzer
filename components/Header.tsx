"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-slate-800 hover:text-blue-600 transition">
          芸能人スタイルランキング
        </Link>
        <Link
          href="/analyze"
          className="rounded-full bg-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-600"
        >
          AIスタイル診断
        </Link>
      </div>
    </header>
  );
}
