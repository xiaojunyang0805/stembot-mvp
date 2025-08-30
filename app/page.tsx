'use client';
import { supabase } from '@/utils/supabase/client';

export default function Home() {
  const handleGoogleLogin = async () => {
    try {
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/dashboard', 
          scopes: 'email profile',
        },
      });
      if (error) {
        console.error('OAuth Error:', error.message, 'Status:', error.status);
      } else {
        console.log('OAuth Redirect Initiated:', data);
      }
    } catch (err) {
      console.error('Unexpected Client Error:', err instanceof Error ? err.message : err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-5xl font-bold">Welcome to StemBot!</h1>
      <button
        onClick={handleGoogleLogin}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Sign in with Google
      </button>
    </div>
  );
}