'use client';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [bots] = useState([
    { id: 1, name: "Bot 1", created_at: "2025-09-01" },
    { id: 2, name: "Bot 2", created_at: "2025-09-02" },
    { id: 3, name: "Bot 3", created_at: "2025-09-03" },
  ]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Dashboard: Session exists:', !!session, 'Verified:', !!session?.user.email_confirmed_at);
      if (!session || !session.user.email_confirmed_at) {
        router.push(session ? '/verify' : '/login');
      }
    };
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    console.log('Logout: Attempting signOut');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      console.log('Logout: Success, redirecting to /login');
      await supabase.auth.refreshSession();
      router.push('/login');
      router.refresh();
    } else {
      console.error('Logout error:', error.message);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl mb-4">StemBot Dashboard</h1>
      <aside className="bg-gray-50 p-6 md:block">
        <nav>
          <a href="/dashboard" className="block hover:bg-blue-500">Dashboard</a>
          <a href="/create-bot" className="block hover:bg-blue-500">Create Bot</a>
          <button
            onClick={handleLogout}
            className="block hover:bg-blue-500 text-left w-full"
          >
            Logout
          </button>
        </nav>
      </aside>
      <main className="md:pt-8">
        <h2 className="text-3xl">Your Bots</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.length ? (
            bots.map(bot => (
              <div key={bot.id} className="p-6 border-2 border-gray-300 hover:scale-105">
                <p>{bot.name}</p>
                <p>{bot.created_at}</p>
              </div>
            ))
          ) : (
            <p>No bots yet</p>
          )}
        </div>
      </main>
    </div>
  );
}