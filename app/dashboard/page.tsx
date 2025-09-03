'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { User } from '@supabase/supabase-js';

interface Bot {
  id: string;
  name: string;
  created_at: string;
}

export default function Dashboard() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [bots, setBots] = useState<Bot[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndBots = async () => {
      try {
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }
        setUser(user);

        // Fetch bots for the authenticated user
        const { data, error } = await supabase
          .from('bots')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          setError('Failed to load bots. Please try again.');
          return;
        }

        setBots(data || []);
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndBots();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
    } else {
      setError('Failed to log out. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/login" className="mt-4 inline-block text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gray-50 shadow-md transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } md:static md:block transition-transform duration-300 ease-in-out z-40 ${
          isSidebarOpen ? 'block' : 'hidden md:block'
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          <h2 className="text-2xl font-bold text-gray-800">StemBot</h2>
          <nav className="mt-8 flex-1">
            <ul className="space-y-3">
              <li>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-lg text-gray-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/create-bot"
                  className="block px-4 py-2 text-lg text-gray-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
                  onClick={() => setIsSidebarOpen(false)}
                >
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
        className="p-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 md:hidden z-50 fixed top-4 left-4"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle menu"
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
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No bots created yet.</p>
            <p className="text-gray-400">Start by creating your first bot!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
              >
                <h3 className="text-xl font-medium text-gray-800">{bot.name}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Created: {new Date(bot.created_at).toLocaleDateString()}
                </p>
                <Link
                  href={`/bot/${bot.id}`}
                  className="mt-4 inline-block bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                >
                  View Bot
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}