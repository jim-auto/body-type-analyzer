import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "体型バランスAI診断 | Body Type Analyzer",
  description: "AIがあなたの体型バランスを雰囲気で診断します",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} antialiased`}>
      <body className="min-h-screen font-[family-name:var(--font-noto-sans-jp)]">
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
