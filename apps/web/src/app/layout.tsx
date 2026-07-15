import type { Metadata } from "next";
import { Amaranth, Nobile } from "next/font/google";
import "@katalyst/ui/tokens.css";
import "./globals.css";

const amaranth = Amaranth({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-amaranth",
});

const nobile = Nobile({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-nobile",
});

export const metadata: Metadata = {
  title: "Katalyst — Campaign infrastructure by Political Revolution",
  description:
    "Unified open-source organizing suite for democratic socialist campaigns and movement orgs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${amaranth.variable} ${nobile.variable}`}>
      <body>{children}</body>
    </html>
  );
}
