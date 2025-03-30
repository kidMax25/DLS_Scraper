'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Auth from '@/components/auth';
import useStore from '@/store';

export default function RegisterPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Auth />
    </div>
  );
}