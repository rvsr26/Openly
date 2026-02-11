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

        {/* Global Ambient Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] opacity-20 animate-blob" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] opacity-10 animate-blob animation-delay-4000" />
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        </div>

        <Providers>
          <ActivityTracker />
          <div className="relative z-10 flex flex-col min-h-screen">
            {/* Navbar is rendered inside pages or here if global. 
                However, existing code has Navbar in specific pages. 
                We should verify if we want to make it global. 
                For now, we keep it as is but provide the z-index context. 
            */}
            {children}
          </div>
          <Toaster position="bottom-right" richColors theme="system" />
        </Providers>
      </body>
    </html>
  );
}
