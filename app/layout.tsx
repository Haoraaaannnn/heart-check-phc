import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { tiltWarp, Baloo } from "@/fonts/fonts";
import "@/app/globals.css";
import "boxicons/css/boxicons.min.css";
import { ThemeProvider } from "./provider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Heart Check PHC",
  description: "Queueing Management System for the Out-Patient Department of Philippine Heart Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${tiltWarp.variable} ${Baloo.variable}`} suppressHydrationWarning>
      <head>
        <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet' />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-[#0d0d0d] dark:text-[#f5f5f5] transition-colors duration-300`}>
        <ThemeProvider>          
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}