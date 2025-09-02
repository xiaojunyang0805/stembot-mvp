'use client';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.email_confirmed_at) {
        router.push('/dashboard');
      } else if (session && !session.user.email_confirmed_at) {
        router.push('/verify');
      }
    };
    checkSession();
  }, [router]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
      },
    });
    if (error) {
      console.error('Login error:', error.message);
      setError('Login failed: ' + error.message);
    }
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-2xl mb-4">Welcome to StemBot</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button
        onClick={handleGoogleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Login with Google
      </button>
    </div>
  );
}