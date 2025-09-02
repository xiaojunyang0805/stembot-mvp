'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

interface Bot {
  id: number;
  name: string;
  created_at: string;
}

export default function DashboardPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bots] = useState<Bot[]>([
    { id: 1, name: 'Bot 1', created_at: '2025-09-01' },
    { id: 2, name: 'Bot 2', created_at: '2025-09-02' },
    { id: 3, name: 'Bot 3', created_at: '2025-09-03' },
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
  }, [router, supabase]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
    } else {
      console.error('Logout error:', error.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gray-50 shadow-md transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } md:static md:block transition-transform duration-300 ease-in-out z-40 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}
      >
        <div className="p-6 flex flex-col h-full">
          <h2 className="text-2xl font-bold text-gray-800">StemBot</h2>
          <nav className="mt-8 flex-1">
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="block px-4 py-2 text-lg text-gray-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/create-bot" className="block px-4 py-2 text-lg text-gray-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors">
                  Create Bot
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-lg text-gray-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                >
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Toggle Button */}
      <button
        className={`p-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 sm:hidden z-50 ${
          isSidebarOpen ? 'fixed bottom-4 left-4' : 'fixed top-6 left-6'
        }`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? 'Close' : 'Menu'}
      </button>

      {/* Main Panel */}
      <main className="flex-1 p-6 pt-20 md:pt-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">Your Bots</h1>
          <Link href="/create-bot">
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
              Create Bot
            </button>
          </Link>
        </div>

        {/* Bot List */}
        {bots.length === 0 ? (
          <p className="text-gray-500 text-center text-lg">No bots yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 border-gray-300"
              >
                <h3 className="text-xl font-medium text-gray-800">{bot.name}</h3>
                <p className="text-sm text-gray-600 mt-2">Created: {bot.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}