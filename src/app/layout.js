import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

export const metadata = {
  title: "เที่ยวกับไอ | Travel with AI",
  description: "AI Chatbot สำหรับช่วยวางแผนการเดินทางในชะอำและหัวหิน",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className="theme-light" style={{ fontFamily: 'var(--font-prompt), sans-serif' }}>{children}</body>
    </html>
  );
}
