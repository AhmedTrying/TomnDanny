import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  // Fetch all table_numbers from orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('table_number');

  if (error) return new Response(JSON.stringify({ error }), { status: 500 });
  if (!orders || orders.length === 0) return new Response(JSON.stringify(null), { status: 200 });

  // Count occurrences of each table_number
  const tableCounts: Record<number, number> = {};
  orders.forEach((order: any) => {
    if (order.table_number != null) {
      tableCounts[order.table_number] = (tableCounts[order.table_number] || 0) + 1;
    }
  });

  // Find the most frequent table_number
  let maxTable = null;
  let maxCount = 0;
  for (const [table, count] of Object.entries(tableCounts)) {
    if (count > maxCount) {
      maxTable = table;
      maxCount = count;
    }
  }

  if (maxTable === null) return new Response(JSON.stringify(null), { status: 200 });
  return new Response(JSON.stringify({ table_number: Number(maxTable), order_count: maxCount }), { status: 200 });
} 