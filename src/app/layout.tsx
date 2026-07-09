import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dental Talent Acquisition OS",
  description: "口腔医疗招聘全流程智能工作台 · dental_recruit_os",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
