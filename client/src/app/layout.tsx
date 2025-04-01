'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ConsentModal } from '@/components/consent-modal';
import { useAuth } from '@/context/AuthContext';
import useStore from '@/store';
import './globals.css';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Inner layout component that has access to auth context
function InnerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const setUser = useStore((state) => state.setUser);
  const setShowConsentModal = useStore((state) => state.setShowConsentModal);

  // Sync AuthContext user with Zustand store
  useEffect(() => {
    if (user && !isLoading) {
      setUser(user);
      
      // Check if user has accepted consent
      if (!localStorage.getItem('consent-accepted')) {
        setShowConsentModal(true);
      }
    }
  }, [user, isLoading, setUser, setShowConsentModal]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <main className="flex-1">
          {children}
          <ConsentModal />
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Legends Arena</title>
        <meta name="description" content="Dream League Soccer online gaming platform" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <InnerLayout>
              {children}
            </InnerLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}