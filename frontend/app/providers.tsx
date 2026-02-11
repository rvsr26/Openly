"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '../context/AuthContext';
import Navbar from './components/Navbar';
import { usePathname } from 'next/navigation';

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const noNavbarRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/setup-username'];
  const showNavbar = !noNavbarRoutes.includes(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {showNavbar && <Navbar />}
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}