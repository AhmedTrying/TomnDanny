import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Create customers table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS customers (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(20) UNIQUE NOT NULL,
          email VARCHAR(255),
          address TEXT,
          loyalty_points INTEGER DEFAULT 0,
          total_orders INTEGER DEFAULT 0,
          total_spent DECIMAL(10,2) DEFAULT 0.00,
          date_of_birth DATE,
          notes TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (tableError) {
      console.error('Table creation error:', tableError)
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
        CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
        CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
        CREATE INDEX IF NOT EXISTS idx_customers_loyalty_points ON customers(loyalty_points);
      `
    })

    if (indexError) {
      console.error('Index creation error:', indexError)
    }

    // Insert sample data directly using Supabase client
    const sampleCustomers = [
      {
        name: 'John Doe',
        phone: '+60123456789',
        email: 'john.doe@email.com',
        loyalty_points: 150,
        total_orders: 12,
        total_spent: 245.50
      },
      {
        name: 'Jane Smith',
        phone: '+60198765432',
        email: 'jane.smith@email.com',
        loyalty_points: 89,
        total_orders: 8,
        total_spent: 156.75
      },
      {
        name: 'Ahmad Rahman',
        phone: '+60187654321',
        email: 'ahmad.rahman@email.com',
        loyalty_points: 220,
        total_orders: 18,
        total_spent: 398.25
      },
      {
        name: 'Siti Nurhaliza',
        phone: '+60176543210',
        email: 'siti.nurhaliza@email.com',
        loyalty_points: 45,
        total_orders: 5,
        total_spent: 89.50
      },
      {
        name: 'David Tan',
        phone: '+60165432109',
        email: 'david.tan@email.com',
        loyalty_points: 310,
        total_orders: 25,
        total_spent: 567.80
      },
      {
        name: 'Maria Garcia',
        phone: '+60154321098',
        email: 'maria.garcia@email.com',
        loyalty_points: 78,
        total_orders: 7,
        total_spent: 134.25
      },
      {
        name: 'Raj Patel',
        phone: '+60143210987',
        email: 'raj.patel@email.com',
        loyalty_points: 195,
        total_orders: 15,
        total_spent: 289.90
      },
      {
        name: 'Lisa Wong',
        phone: '+60132109876',
        email: 'lisa.wong@email.com',
        loyalty_points: 67,
        total_orders: 6,
        total_spent: 112.40
      }
    ]

    // Insert sample customers
    const { error: insertError } = await supabase
      .from('customers')
      .upsert(sampleCustomers, { onConflict: 'phone' })

    if (insertError) {
      console.error('Sample data insertion error:', insertError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Customers table setup completed successfully',
      tableError,
      indexError,
      insertError
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to setup customers table' },
      { status: 500 }
    )
  }
}