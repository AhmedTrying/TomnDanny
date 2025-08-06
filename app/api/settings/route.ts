import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET: Fetch settings
export async function GET() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

// POST: Update settings
export async function POST(req: Request) {
  const body = await req.json()
  const { cafe_name, location, phone_number, operating_hours, system_config } = body
  // Always update the latest row (or insert if none exists)
  let { data: existing, error: fetchError } = await supabase
    .from('settings')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()
  if (fetchError && fetchError.code !== 'PGRST116') {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }
  let result
  if (existing) {
    // Update
    const { data, error } = await supabase
      .from('settings')
      .update({ cafe_name, location, phone_number, operating_hours, system_config, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    result = data
  } else {
    // Insert
    const { data, error } = await supabase
      .from('settings')
      .insert([{ cafe_name, location, phone_number, operating_hours, system_config, updated_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    result = data
  }
  return NextResponse.json(result)
} 