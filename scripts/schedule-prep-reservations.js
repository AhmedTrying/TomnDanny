const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function schedulePrep() {
  const now = new Date();
  const fifteenMinsLater = new Date(now.getTime() + 15 * 60000);
  const today = now.toISOString().split('T')[0];

  // Fetch reservations that need to be updated
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('dining_type', 'reservation')
    .eq('status', 'reservation_confirmed')
    .eq('reservation_date', today)
    .lte('reservation_time', fifteenMinsLater.toTimeString().slice(0, 8))
    .gt('reservation_time', now.toTimeString().slice(0, 8));

  if (error) {
    console.error('Error fetching reservations:', error);
    return;
  }

  for (const order of orders) {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'preparing' })
      .eq('id', order.id);
    if (updateError) {
      console.error(`Error updating order ${order.id}:`, updateError);
    } else {
      console.log(`Order ${order.id} set to preparing.`);
    }
  }
}

schedulePrep().then(() => process.exit()); 