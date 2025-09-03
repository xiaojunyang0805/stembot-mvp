'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

interface Bot {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export default function BotPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [bot, setBot] = useState<Bot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBot = async () => {
      try {
        // Check authentication first
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        // Fetch the specific bot
        const { data, error } = await supabase
          .from('bots')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching bot:', error);
          setError('Bot not found');
          return;
        }

        setBot(data);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBot();
    }
  }, [id, supabase, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading bot...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-600">{error}</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">Bot Details</h1>
          <Link href="/dashboard">
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
              Back to Dashboard
            </button>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {bot ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{bot.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Bot Information</h3>
                  <p className="text-gray-600">
                    <span className="font-semibold">ID:</span> {bot.id}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Created:</span> {new Date(bot.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Coming Soon</h3>
                <p className="text-blue-600">
                  AI features and bot management tools will be implemented in the next phase.
                </p>
              </div>
            </>
          ) : (
            <p className="text-gray-500">No bot data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}