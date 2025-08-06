import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    const date = searchParams.get('date');
    let query = supabase
      .from('checkins')
      .select('*, users:staff_profiles(full_name, email)');
    if (user_id) query = query.eq('user_id', user_id);
    if (date) query = query.eq('date', date);
    const { data, error } = await query.order('date', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { error } = await supabase.from('checkins').upsert([data], { onConflict: 'user_id,date' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
} 