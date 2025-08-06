# Events System Documentation

## Overview
The Events System allows coffee shop administrators to create, manage, and publish events that customers can view and RSVP to. The system includes both admin controls and public-facing pages.

## Features

### ✅ Admin Dashboard Controls
- **Events Management Tab**: Located in the admin dashboard under "Events Management"
- **Add New Events**: Create events with title, description, date/time, image, and status
- **Edit Events**: Modify existing events
- **Delete Events**: Remove events from the system
- **Status Management**: Set events as draft, published, or cancelled
- **Image Upload**: Drag-and-drop or browse for event images
- **Rich Text Description**: Support for markdown-like formatting (**bold**, *italic*)

### ✅ Public Events Page
- **Events Listing**: `/events` - Shows all published events
- **Filtering**: Filter by upcoming, past, or all events
- **Search**: Search events by title or description
- **Event Cards**: Display event image, title, date, and preview
- **RSVP Functionality**: Allow customers to RSVP for events
- **Social Sharing**: Share events on social media platforms
- **Calendar Integration**: Add events to Google Calendar

### ✅ Individual Event Pages
- **Event Details**: `/events/[id]` - Full event information
- **Rich Description**: Support for formatted text with **bold** and *italic*
- **RSVP Form**: Customer registration with name, email, phone, guest count
- **Attendee List**: Show confirmed RSVPs
- **Social Sharing**: Facebook, Twitter, Instagram, Email sharing
- **Calendar Export**: One-click Google Calendar integration

## Database Schema

### Events Table
```sql
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Event RSVPs Table
```sql
CREATE TABLE event_rsvps (
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
```

## Setup Instructions

### 1. Database Setup
Run the SQL script to create the events tables:
```bash
# Execute the SQL script in your Supabase dashboard
# File: scripts/add-events-system.sql
```

### 2. File Structure
The events system consists of these files:
- `app/events/page.tsx` - Public events listing page
- `app/events/[id]/page.tsx` - Individual event detail page
- `app/admin/page.tsx` - Admin dashboard (updated with events management)
- `lib/supabase.ts` - Database types (updated with events interfaces)
- `scripts/add-events-system.sql` - Database schema

### 3. Navigation
Events are accessible via:
- **Public**: `/events` (added to main navigation)
- **Admin**: Admin Dashboard → Events Management tab

## Usage Guide

### For Administrators

#### Creating an Event
1. Navigate to Admin Dashboard → Events Management
2. Fill in the event form:
   - **Title**: Event name (required)
   - **Description**: Event details with formatting support
   - **Date & Time**: When the event takes place (required)
   - **Status**: Draft, Published, or Cancelled
   - **Image**: Upload an event banner/poster
3. Click "Add Event"

#### Managing Events
- **Edit**: Click the edit button on any event card
- **Delete**: Click the delete button (with confirmation)
- **View Public Page**: Click "View" to see the public event page
- **Status Management**: Change status to control visibility

### For Customers

#### Browsing Events
1. Visit `/events` on the website
2. Use filters to view upcoming, past, or all events
3. Search for specific events using the search bar
4. Click on any event to view full details

#### RSVP for Events
1. On the events page, click "RSVP Now" on any upcoming event
2. Fill in the RSVP form:
   - **Name**: Your full name (required)
   - **Email**: Contact email (optional)
   - **Phone**: Contact number (optional)
   - **Number of Guests**: How many people (1-10)
   - **Special Requests**: Any dietary restrictions or notes
3. Click "Confirm RSVP"

#### Sharing Events
- **Social Media**: Use the share buttons on event cards
- **Calendar**: Click "Add to Calendar" to add to Google Calendar
- **Direct Link**: Copy the event URL to share directly

## Features in Detail

### Rich Text Description
Event descriptions support markdown-like formatting:
- `**bold text**` → **bold text**
- `*italic text*` → *italic text*
- Line breaks are preserved

### Image Management
- **Upload**: Drag-and-drop or browse for images
- **Preview**: See uploaded images in the admin form
- **Storage**: Images are stored in Supabase storage
- **Optimization**: Images are automatically optimized for web

### RSVP System
- **Confirmation**: Automatic confirmation emails (if email provided)
- **Guest Management**: Track number of attendees
- **Notes**: Allow special requests and dietary restrictions
- **Status Tracking**: Monitor RSVP status (confirmed, cancelled, waitlist)

### Social Sharing
- **Facebook**: Direct share to Facebook
- **Twitter**: Share with event details
- **Instagram**: Copy details for Instagram posts
- **Email**: Send event details via email
- **Native Sharing**: Use device's native share functionality

### Calendar Integration
- **Google Calendar**: One-click add to Google Calendar
- **Event Details**: Automatically includes title, date, time, and description
- **Location**: Includes coffee shop location

## Security & Permissions

### Row Level Security (RLS)
- **Public Read**: Anyone can view published events
- **Public Write**: Anyone can create RSVPs for published events
- **Admin Full Access**: Authenticated users can manage all events and RSVPs

### Data Validation
- **Required Fields**: Title and date are required for events
- **Status Validation**: Only valid statuses are allowed
- **Date Validation**: Events must have valid dates
- **Email Validation**: Optional email addresses are validated

## Customization

### Styling
The events system uses the existing design system:
- **Colors**: Brand colors (brand-navy, brand-caramel, brand-cream)
- **Components**: Reuses existing UI components
- **Responsive**: Mobile-friendly design

### Content
- **Event Types**: Can be customized for different event types
- **RSVP Fields**: Additional fields can be added to RSVP form
- **Email Templates**: RSVP confirmation emails can be customized

## Troubleshooting

### Common Issues

#### Events Not Showing
- Check if events are set to "published" status
- Verify the date is in the future for upcoming events
- Check database permissions

#### RSVP Not Working
- Verify the event is published
- Check form validation (name is required)
- Review browser console for errors

#### Image Upload Issues
- Check Supabase storage permissions
- Verify file type (images only)
- Check file size limits

### Database Queries

#### Get All Published Events
```sql
SELECT * FROM events 
WHERE status = 'published' 
ORDER BY date ASC;
```

#### Get Event RSVPs
```sql
SELECT * FROM event_rsvps 
WHERE event_id = 'event-uuid' 
AND status = 'confirmed' 
ORDER BY created_at DESC;
```

#### Get Upcoming Events
```sql
SELECT * FROM events 
WHERE status = 'published' 
AND date > NOW() 
ORDER BY date ASC;
```

## Future Enhancements

### Planned Features
- **Event Categories**: Organize events by type
- **Recurring Events**: Support for weekly/monthly events
- **Event Capacity**: Limit number of RSVPs
- **Waitlist Management**: Automatic waitlist for full events
- **Email Notifications**: Automated event reminders
- **Analytics**: Track event engagement and RSVP rates
- **QR Code Check-in**: Scan QR codes for event check-in
- **Event Photos**: Gallery of event photos
- **Integration**: Connect with external calendar systems

### API Endpoints
Future API endpoints for external integrations:
- `GET /api/events` - List all published events
- `GET /api/events/[id]` - Get specific event details
- `POST /api/events/[id]/rsvp` - Create RSVP
- `GET /api/events/[id]/rsvps` - Get event RSVPs (admin only)

## Support

For technical support or questions about the events system:
1. Check this documentation
2. Review the database schema
3. Check browser console for errors
4. Verify Supabase permissions
5. Contact the development team

---

**Last Updated**: December 2024
**Version**: 1.0.0 