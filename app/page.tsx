'use client';
import { supabase } from '@/utils/supabase/client';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-5xl font-bold">Welcome to StemBot!</h1>
      <p className="mt-3 text-2xl">This is the home page. Edit this file to get started.</p>
    </div>
  );
}