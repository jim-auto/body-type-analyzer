import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 py-8 text-center text-xs text-slate-400">
      <p>本サービスはエンタメ用途です。診断に医学的根拠はありません。</p>
      <p className="mt-1">
        アップロードされた画像はサーバーに送信されません。ブラウザ内で処理されます。
      </p>
      <p className="mt-3">
        <Link
          href="/credits"
          className="font-medium text-slate-500 underline underline-offset-4 transition hover:text-slate-700"
        >
          画像クレジット
        </Link>
      </p>
    </footer>
  );
}
