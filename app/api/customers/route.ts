import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')

    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (phone) {
      query = query.eq('phone', phone)
    }

    if (email) {
      query = query.eq('email', email)
    }

    const { data: customers, error } = await query.limit(20)

    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Error in customers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { name, phone, email, address, notes } = body

    // All customer fields are now optional

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        name,
        phone,
        email,
        address,
        notes,
        loyalty_points: 0,
        total_orders: 0,
        total_spent: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error in customers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id, loyalty_points, total_orders, total_spent } = body

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (loyalty_points !== undefined) updateData.loyalty_points = loyalty_points
    if (total_orders !== undefined) updateData.total_orders = total_orders
    if (total_spent !== undefined) updateData.total_spent = total_spent

    const { data: customer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error in customers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}