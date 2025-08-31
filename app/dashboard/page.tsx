'use client';
import Link from 'next/link';

interface Bot {
  id: number;
  name: string;
  created_at: string;
}

export default function DashboardPage() {
  const bots: Bot[] = [
    { id: 1, name: 'Bot 1', created_at: '2025-09-01' },
    { id: 2, name: 'Bot 2', created_at: '2025-09-02' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800">StemBot</h2>
          <nav className="mt-6">
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="block px-4 py-2 text-gray-600 hover:bg-blue-500 hover:text-white rounded">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/create-bot" className="block px-4 py-2 text-gray-600 hover:bg-blue-500 hover:text-white rounded">
                  Create Bot
                </Link>
              </li>
              <li>
                <Link href="/login" className="block px-4 py-2 text-gray-600 hover:bg-blue-500 hover:text-white rounded">
                  Logout
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Your Bots</h1>
          <Link href="/create-bot">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Create Bot
            </button>
          </Link>
        </div>

        {/* Bot List */}
        {bots.length === 0 ? (
          <p className="text-gray-500 text-center">No bots yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bots.map((bot) => (
              <div key={bot.id} className="bg-white p-4 rounded shadow-md">
                <h3 className="text-lg font-medium text-gray-800">{bot.name}</h3>
                <p className="text-sm text-gray-600">Created: {bot.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}