import type { Metadata } from "next";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "芸能人スタイルランキング | AIが偏差値で格付け",
  description:
    "芸能人のスタイルをAIが偏差値で格付け。身長とカップ数の推定ランキングも掲載。",
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
        <Footer />
      </body>
    </html>
  );
}
