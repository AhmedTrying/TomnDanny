"use client";
import { useSettings } from '@/lib/settings-context';

function getNextOpenTime(open: string) {
  // Format open time as e.g. 06:00 AM
  const [h, m] = open.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ClosedPage() {
  const settings = useSettings();
  const open = settings?.operating_hours?.open || '06:00';
  const cafeName = settings?.cafe_name || 'Café';
  const nextOpen = getNextOpenTime(open);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream text-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-brand-navy mb-4">{cafeName} Orders Closed</h1>
        <p className="text-lg text-brand-medium-brown mb-4">
          Sorry, website orders are closed until <span className="font-bold text-brand-caramel">{nextOpen}</span>.
        </p>
        <p className="text-sm text-brand-medium-brown">
          Please come back during our open hours. Thank you!
        </p>
      </div>
    </div>
  );
} 