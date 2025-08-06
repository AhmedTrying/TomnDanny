const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envLines = envContent.split('\n')

let supabaseUrl, supabaseKey
envLines.forEach(line => {
  const trimmedLine = line.trim()
  if (trimmedLine.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = trimmedLine.split('=')[1]
  }
  if (trimmedLine.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseKey = trimmedLine.split('=')[1]
  }
})

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndAddColumns() {
  console.log('Checking if columns exist in orders table...')
  
  try {
    // Test if columns exist by trying to select them
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('cash_received, split_payments, change_due')
      .limit(1)
    
    if (!testError) {
      console.log('✓ All required columns already exist in orders table!')
      return true
    }
    
    console.log('Missing columns detected. Error:', testError.message)
    console.log('\n=== MANUAL SQL REQUIRED ===')
    console.log('Please run the following SQL in your Supabase dashboard:')
    console.log('\n1. Go to your Supabase project dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Run this SQL:')
    console.log('\n```sql')
    console.log('ALTER TABLE orders')
    console.log('ADD COLUMN IF NOT EXISTS cash_received NUMERIC,')
    console.log('ADD COLUMN IF NOT EXISTS split_payments JSONB,')
    console.log('ADD COLUMN IF NOT EXISTS change_due NUMERIC;')
    console.log('')
    console.log('CREATE INDEX IF NOT EXISTS idx_orders_cash_received ON orders(cash_received);')
    console.log('CREATE INDEX IF NOT EXISTS idx_orders_split_payments ON orders USING GIN(split_payments);')
    console.log('CREATE INDEX IF NOT EXISTS idx_orders_change_due ON orders(change_due);')
    console.log('```')
    console.log('\n4. After running the SQL, test placing an order again')
    
    return false
  } catch (err) {
    console.error('Error checking columns:', err)
    return false
  }
}

// Run the function
checkAndAddColumns().then(() => {
  console.log('Script completed')
  process.exit(0)
}).catch(err => {
  console.error('Script failed:', err)
  process.exit(1)
})