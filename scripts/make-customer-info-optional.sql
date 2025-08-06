-- Make all customer information optional across all tables

-- Remove NOT NULL constraint from event_rsvps.customer_name
ALTER TABLE event_rsvps ALTER COLUMN customer_name DROP NOT NULL;

-- Remove NOT NULL constraint from reservations.customer_name
ALTER TABLE reservations ALTER COLUMN customer_name DROP NOT NULL;

-- Remove NOT NULL constraint from reviews.customer_name
ALTER TABLE reviews ALTER COLUMN customer_name DROP NOT NULL;

-- Remove NOT NULL constraints from customers table
ALTER TABLE customers ALTER COLUMN name DROP NOT NULL;
ALTER TABLE customers ALTER COLUMN phone DROP NOT NULL;

-- Remove UNIQUE constraint from customers.phone since it can now be NULL
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_key;

-- Add a new unique constraint that allows multiple NULL values
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_unique 
ON customers (phone) 
WHERE phone IS NOT NULL;

COMMIT;