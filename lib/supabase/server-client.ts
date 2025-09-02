import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createSupabaseServerClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: any) {
          try {
            const cookieStore = await cookies();
            cookieStore.set(name, value, options);
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        async remove(name: string) {
          try {
            const cookieStore = await cookies();
            cookieStore.delete(name);
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );
};