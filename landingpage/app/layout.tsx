import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MHT CET PYQ - Previous Year Question Papers | MCQ Practice App",
  description: "Master MHT CET with 4000+ PYQ questions from 2015-2024. Practice Physics, Chemistry, Maths, Biology with AI-powered solutions. Free and Premium plans available. Ace your MHT CET 2026 exam preparation!",
  keywords: [
    "MHT CET PYQ",
    "MHT CET previous year questions",
    "MHT CET question papers",
    "MHT CET practice",
    "MHT CET MCQ",
    "MHT CET 2026",
    "Maharashtra CET PYQ",
    "MHT CET preparation",
    "MHT CET online test",
    "MHT CET practice papers",
    "PCM PYQ",
    "PCB PYQ",
    "PCMB PYQ",
  ],
  openGraph: {
    title: "MHT CET PYQ - Previous Year Question Papers | MCQ Practice App",
    description: "Master MHT CET with 4000+ PYQ questions. Practice with AI-powered solutions and comprehensive analytics.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MHT CET PYQ - Previous Year Question Papers",
    description: "Master MHT CET with 4000+ PYQ questions. Practice with AI-powered solutions.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
