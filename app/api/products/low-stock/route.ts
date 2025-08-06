import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const threshold = 5; // You can make this configurable if needed

  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock_quantity, image_url')
    .lt('stock_quantity', threshold)
    .order('stock_quantity', { ascending: true });

  if (error) return new Response(JSON.stringify({ error }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
}