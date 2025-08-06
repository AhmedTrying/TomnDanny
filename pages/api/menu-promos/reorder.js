import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

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

  try {
    const { promoIds } = req.body;
    
    if (!Array.isArray(promoIds)) {
      return res.status(400).json({ error: 'promoIds must be an array' });
    }

    // First, get all promos to preserve their data
    const { data: existingPromos, error: fetchError } = await supabase
      .from('menu_promos')
      .select('*')
      .in('id', promoIds);
    
    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    // Create updates with all existing data plus new sort_order
    const updates = promoIds.map((id, index) => {
      const existingPromo = existingPromos.find(p => p.id === id);
      return {
        ...existingPromo,
        sort_order: index + 1
      };
    });

    // Use upsert to update all promos at once
    const { data, error } = await supabase
      .from('menu_promos')
      .upsert(updates, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Reorder error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Reorder error:', error);
    return res.status(500).json({ error: error.message });
  }
} 