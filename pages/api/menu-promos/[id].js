import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const {
    query: { id },
    method,
    cookies,
    headers,
    body,
  } = req;

  // Auth: extract token from cookies or Authorization header
  let token = Object.entries(cookies).find(([key]) => key.startsWith('sb-') && key.endsWith('-auth-token'))?.[1];
  if (token) {
    try { token = JSON.parse(token)[0]; } catch (e) {}
  }
  if (!token && headers.authorization) {
    const match = headers.authorization.match(/^Bearer (.+)$/);
    if (match) token = match[1];
  }
  if (!token) return res.status(401).json({ error: 'Unauthorized (no token)' });

  const userRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  });
  const user = userRes.ok ? await userRes.json() : null;
  if (!user || !user.id) return res.status(401).json({ error: 'Unauthorized' });

  // Check admin role
  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (method === 'PATCH') {
    // Only update provided fields, but preserve required fields
    const { promo_text, active } = body;
    // Fetch existing row to preserve required fields
    const { data: existing, error: fetchError } = await supabase
      .from('menu_promos')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Promo not found' });
    }
    const updateData = {
      promo_text: promo_text !== undefined ? promo_text : existing.promo_text,
      active: active !== undefined ? active : existing.active,
      image_url: existing.image_url, // required
      sort_order: existing.sort_order, // required
      created_by: existing.created_by,
      created_at: existing.created_at,
    };
    const { data, error } = await supabase
      .from('menu_promos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (method === 'DELETE') {
    const { error } = await supabase
      .from('menu_promos')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
} 