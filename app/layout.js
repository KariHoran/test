import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "ReelsHub — Аналитика Instagram Reels",
  description: "Дашборд для блогеров: отслеживание просмотров Reels в Instagram",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${manrope.variable} ${inter.variable}`}>
      <body
        style={{
          fontFamily: "var(--font-body)",
          ["--font-display-fallback"]: manrope.style.fontFamily,
          ["--font-body-fallback"]: inter.style.fontFamily,
        }}
      >
        {children}
      </body>
    </html>
  );
}
