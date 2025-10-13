import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { preconnect } from "react-dom";
import "./globals.css";
import { headers } from "next/headers";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Farcaster Marketplace",
  description: "Farcaster Marketplace",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  preconnect("https://auth.farcaster.xyz");
  const headersStore = await headers();
  const cookie = headersStore.get("cookie");

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers cookie={cookie || undefined}>{children}</Providers>
      </body>
    </html>
  );
}
