import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "紅山 ERP Demo",
  description: "紅山商業空間設計客製 ERP Demo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
