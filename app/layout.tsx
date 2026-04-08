import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "芸能人スタイルランキング | AIが偏差値で格付け",
  description: "芸能人のスタイルをAIが偏差値で格付け！身長・カップ数の推定ランキングも",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="antialiased">
      <body className="min-h-screen">
        <Header />
        {children}
        <footer className="text-xs text-slate-400 text-center py-8 mt-16 border-t border-slate-200">
          <p>本サービスはエンタメ目的です。結果に科学的根拠はありません。</p>
          <p className="mt-1">アップロードされた画像はサーバーに送信されません。すべてブラウザ内で処理されます。</p>
        </footer>
      </body>
    </html>
  );
}
