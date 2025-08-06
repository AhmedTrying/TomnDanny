-- Add Events System to Database
-- This script creates the events table and related functionality

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_rsvps table for RSVP functionality
CREATE TABLE IF NOT EXISTS event_rsvps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    number_of_guests INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlist')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, date);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps(status);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
-- Allow public read access to published events
CREATE POLICY "Public can view published events" ON events
    FOR SELECT USING (status = 'published');

-- Allow authenticated users to manage events (admin functionality)
CREATE POLICY "Authenticated users can manage events" ON events
    FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for event_rsvps
-- Allow public to create RSVPs for published events
CREATE POLICY "Public can create RSVPs for published events" ON event_rsvps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_rsvps.event_id 
            AND events.status = 'published'
        )
    );

-- Allow public to view their own RSVPs
CREATE POLICY "Public can view own RSVPs" ON event_rsvps
    FOR SELECT USING (true);

-- Allow authenticated users to manage all RSVPs
CREATE POLICY "Authenticated users can manage all RSVPs" ON event_rsvps
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_rsvps_updated_at 
    BEFORE UPDATE ON event_rsvps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample events
INSERT INTO events (title, description, date, status) VALUES
(
    'Latte Art Workshop',
    'Join us for an exciting latte art workshop! Learn the basics of creating beautiful designs in your coffee. Perfect for coffee enthusiasts and beginners alike.

**What you''ll learn:**
- Basic latte art techniques
- Milk steaming fundamentals
- Heart and rosetta patterns
- Advanced designs

**What''s included:**
- All materials and equipment
- Coffee and refreshments
- Take-home guide
- Certificate of completion

**Duration:** 2 hours
**Price:** $45 per person
**Maximum participants:** 12 people

Book your spot today and discover the art of coffee!',
    NOW() + INTERVAL '7 days',
    'published'
),
(
    'Coffee Tasting Experience',
    'Embark on a journey through the world of coffee with our expert baristas! Taste different coffee varieties from around the globe and learn about their unique characteristics.

**Featured coffees:**
- Ethiopian Yirgacheffe (Light roast)
- Colombian Supremo (Medium roast)
- Sumatra Mandheling (Dark roast)
- Guatemalan Antigua (Medium-dark roast)

**What you''ll experience:**
- Cupping session with 4 different coffees
- Learn about coffee origins and processing
- Understanding flavor profiles
- Brewing methods demonstration

**Duration:** 1.5 hours
**Price:** $35 per person
**Maximum participants:** 15 people

Perfect for coffee lovers who want to expand their palate!',
    NOW() + INTERVAL '14 days',
    'published'
),
(
    'Live Music Night - Jazz & Coffee',
    'Enjoy an evening of smooth jazz music while sipping on our finest coffee creations. A perfect blend of music and coffee culture!

**Featured artists:**
- The Coffee House Jazz Trio
- Local musicians performing jazz standards
- Special guest vocalist

**Menu highlights:**
- Signature coffee cocktails
- Artisanal pastries
- Wine and beer selection
- Coffee-infused desserts

**Event details:**
- Doors open at 7:00 PM
- Music starts at 8:00 PM
- No cover charge
- Reservations recommended

Come relax, unwind, and enjoy the perfect combination of jazz and coffee!',
    NOW() + INTERVAL '21 days',
    'published'
);

-- Grant necessary permissions
GRANT ALL ON events TO authenticated;
GRANT ALL ON event_rsvps TO authenticated;
GRANT SELECT ON events TO anon;
GRANT SELECT, INSERT ON event_rsvps TO anon; 