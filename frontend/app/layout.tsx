// File: frontend/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export const metadata: Metadata = {
  title: "YEP 2025 | LUCKY DRAW SYSTEM",
  description: "Logistics Excellence - Year End Party Lucky Draw Pro",
  icons: {
    icon: "/favicon.ico", // Bạn có thể thêm icon nếu có
  }
};

export const viewport: Viewport = {
  width: 'device-width',
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
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${montserrat.variable} font-sans antialiased bg-[#001F3F] text-white`}>
        {children}
      </body>
    </html>
  );
}
