'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from '../login/page';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);
  
  // If still loading, show a simple loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  // Use the login page component but with sign-up mode forced
  return <LoginPage initialMode="signup" />;
}