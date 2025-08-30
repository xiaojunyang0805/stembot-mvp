'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js'; // Import User directly

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null); // Use User | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('User fetch error:', error.message);
          window.location.href = '/';
        } else {
          setUser(user);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        window.location.href = '/';
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Logout error:', error.message);
      window.location.href = '/';
    } catch (err) {
      console.error('Unexpected logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold">Welcome to StemBot Dashboard</h1>
      <p className="mt-2">Welcome, {user?.email || 'Guest'}</p>
      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}