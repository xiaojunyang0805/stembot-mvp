'use client';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Verify() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Verify: Session exists:', !!session, 'Verified:', !!session?.user.email_confirmed_at);
      if (session && session.user.email_confirmed_at) {
        router.push('/dashboard');
      }
    };
    checkVerification();
  }, [router, supabase]); // Added supabase

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-2xl mb-4">Verify Your Email</h1>
      <p className="text-gray-500">Please check your email to verify your account, then refresh this page.</p>
    </div>
  );
}