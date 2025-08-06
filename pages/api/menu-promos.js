import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // If ?all=true, return all promos for admin
    const showAll = req.query.all === 'true';
    const query = supabase
      .from('menu_promos')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(20);
    if (!showAll) {
      query.eq('active', true);
    }
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    // Log all cookies for debugging
    console.log('COOKIES:', req.cookies);
    // Dynamically extract the Supabase auth token
    let token = Object.entries(req.cookies).find(([key]) => key.startsWith('sb-') && key.endsWith('-auth-token'))?.[1];
    if (token) {
      try {
        token = JSON.parse(token)[0];
      } catch (e) {}
    }
    if (!token && req.headers.authorization) {
      // Support Bearer token in Authorization header
      const match = req.headers.authorization.match(/^Bearer (.+)$/);
      if (match) token = match[1];
    }
    console.log('EXTRACTED TOKEN:', token);

    if (!token) return res.status(401).json({ error: 'Unauthorized (no token)', debug: req.cookies });

    const userRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    });
    const user = userRes.ok ? await userRes.json() : null;
    console.log('SUPABASE USER:', user, 'USER RESPONSE STATUS:', userRes.status);

    if (!user || !user.id) return res.status(401).json({ error: 'Unauthorized', debug: { user, status: userRes.status } });

    // Check admin role
    const { data: profile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    console.log('STAFF PROFILE:', profile, 'PROFILE ERROR:', profileError);

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', debug: { profile, profileError } });
    }
    // Insert promo
    const { image_url, promo_text } = req.body;
    if (!image_url) return res.status(400).json({ error: 'Image URL is required' });
    // Count current promos
    const { count } = await supabase
      .from('menu_promos')
      .select('id', { count: 'exact', head: true })
      .eq('active', true);
    if ((count ?? 0) >= 10) {
      return res.status(400).json({ error: 'Maximum 10 promos allowed' });
    }
    
    // Get the next sort_order value
    const { data: maxSortOrder } = await supabase
      .from('menu_promos')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();
    
    const nextSortOrder = (maxSortOrder?.sort_order ?? 0) + 1;
    
    const { data, error } = await supabase
      .from('menu_promos')
      .insert({ image_url, promo_text, created_by: user.id, sort_order: nextSortOrder })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 