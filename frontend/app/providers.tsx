"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '../context/AuthContext';
import { KeyboardShortcutsProvider } from '../context/KeyboardShortcutsContext';
import { SystemProvider } from '../context/SystemContext';
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

  const noNavbarRoutes = ['/', '/landing', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/setup-username', '/auth/mfa'];
  const showNavbar = !noNavbarRoutes.includes(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SystemProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <KeyboardShortcutsProvider>
              {showNavbar && <Navbar />}
              {children}
            </KeyboardShortcutsProvider>
          </ThemeProvider>
        </SystemProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}