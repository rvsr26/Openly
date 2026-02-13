import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";
import ActivityTracker from "./components/ActivityTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Space - Insights & Reviews",
  description: "A platform for sharing professional suggestions, reviews, and insights.",
  icons: {
    icon: "/assets/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground relative overflow-x-hidden min-h-screen selection:bg-primary/20 selection:text-primary-foreground`}>

        {/* Global Ambient Background - Simplified for cleaner look */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-background"></div>

        <Providers>
          <ActivityTracker />
          <Navbar />
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
          <Toaster position="bottom-right" richColors theme="system" />
        </Providers>
      </body>
    </html>
  );
}
