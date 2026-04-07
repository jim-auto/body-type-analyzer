"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center px-4 py-3">
        <Link href="/" className="text-lg font-bold text-slate-800 hover:text-blue-600 transition">
          Body Balance Ranking
        </Link>
      </div>
    </header>
  );
}
