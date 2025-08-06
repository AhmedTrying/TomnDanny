import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit')) || 5;

  // Fetch latest orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, created_at, items')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return new Response(JSON.stringify({ error }), { status: 500 });
  if (!orders) return new Response(JSON.stringify([]), { status: 200 });

  // Collect all product ids from all orders
  const productIds = Array.from(new Set(
    orders.flatMap(order => (order.items || []).map((item: any) => item.id))
  ));

  // Fetch product images
  let productImages: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, image_url')
      .in('id', productIds);
    if (!prodError && products) {
      productImages = Object.fromEntries(products.map((p: any) => [p.id, p.image_url]));
    }
  }

  // Attach image_url to each item
  const result = orders.map(order => ({
    id: order.id,
    created_at: order.created_at,
    items: (order.items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      image_url: productImages[item.id] || null
    }))
  }));

  return new Response(JSON.stringify(result), { status: 200 });
}