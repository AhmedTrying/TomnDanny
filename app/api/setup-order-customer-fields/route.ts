import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {

    // Add customer-related fields to orders table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
        ADD COLUMN IF NOT EXISTS customer_name TEXT,
        ADD COLUMN IF NOT EXISTS customer_phone TEXT;
      `
    })

    if (alterError) {
      console.error('Error adding customer fields to orders:', alterError)
      return NextResponse.json({ error: 'Failed to add customer fields to orders table' }, { status: 500 })
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
      `
    })

    if (indexError) {
      console.error('Error creating indexes:', indexError)
      // Don't fail the request for index errors
    }

    return NextResponse.json({ 
      message: 'Customer fields added to orders table successfully',
      success: true 
    })
  } catch (error) {
    console.error('Error in setup-order-customer-fields API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}