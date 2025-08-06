import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function formatTime(dateStr: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function toCSV(rows: any[]) {
  const header = ['Name', 'Date', 'Check-In', 'Check-Out', 'Breaks', 'Total Hours', 'Notes'];
  const csvRows = [header.join(',')];
  for (const row of rows) {
    csvRows.push([
      row.name,
      row.date,
      row.check_in,
      row.check_out,
      row.breaks,
      row.total_hours,
      row.notes ? '"' + row.notes.replace(/"/g, '""') + '"' : ''
    ].join(','));
  }
  return csvRows.join('\n');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const name = searchParams.get('name');

  // Use the new export_checkins function
  const { data, error } = await supabase.rpc('export_checkins', {
    from_date: from || null,
    to_date: to || null,
    name_filter: name || null
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data || []).map((c: any) => {
    const nameVal = c.full_name || c.email || '-';
    const breaks = Array.isArray(c.breaks) ? c.breaks : [];
    const breakCount = breaks.length;
    const breakMinutes = breaks.reduce((sum: number, b: any) => {
      if (b.start && b.end) {
        return sum + (new Date(b.end).getTime() - new Date(b.start).getTime()) / 60000;
      }
      return sum;
    }, 0);
    return {
      name: nameVal,
      date: c.date,
      check_in: formatTime(c.check_in_time),
      check_out: formatTime(c.check_out_time),
      breaks: breakCount + (breakMinutes > 0 ? ` (${Math.round(breakMinutes)} min)` : ''),
      total_hours: c.check_in_time && c.check_out_time ? ((new Date(c.check_out_time).getTime() - new Date(c.check_in_time).getTime()) / 3600000).toFixed(2) : '',
      notes: c.notes || '-',
    };
  });
  const csv = toCSV(rows);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="checkins.csv"',
    },
  });
} 