import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BackgroundHearts } from "@/components/BackgroundHearts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Can I love ?",
  description: "사랑을 기록하는 핑크톤 웹",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="relative min-h-screen text-rose-950">
          <BackgroundHearts />
          <main className="relative z-10 mx-auto w-full px-6 py-10 lg:px-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
