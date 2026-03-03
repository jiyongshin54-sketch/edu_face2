import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Face Auth",
  description: "얼굴 인증 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#080c18] text-[#e8edf8] antialiased">
        <div className="mx-auto min-h-screen max-w-[430px] relative overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
