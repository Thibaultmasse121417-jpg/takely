import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { getLocale } from "@/lib/locale";
import { AuthLinkForwarder } from "@/components/AuthLinkForwarder";
import "./globals.css";

export const metadata: Metadata = {
  title: "Takely — AI video ads from a product photo",
  description: "Turn one product photo and one sentence into a finished video ad, in 32 languages. Plus AI video and image tools.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <AuthLinkForwarder />
        {children}
      </body>
    </html>
  );
}
