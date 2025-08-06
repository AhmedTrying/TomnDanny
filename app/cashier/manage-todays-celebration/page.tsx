'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function ManageTodaysCelebration() {
  const { user } = useAuth();
  const [date, setDate] = useState('2025-06-29');
  const [coffeeName, setCoffeeName] = useState('Colombian Gesha');
  const [description, setDescription] = useState('Experience delicate notes of jasmine, bergamot, and honey.');
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    let imageUrl = image;
    try {
      // 1. Upload image if a new file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `celebrations/${date}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
      // 2. Upsert to todays_celebration table
      const { error: upsertError } = await supabase.from('todays_celebration').upsert([
        {
          date,
          coffee_name: coffeeName,
          description,
          image_url: imageUrl,
          created_by: user?.id || null,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'date' });
      if (upsertError) throw upsertError;
      setSuccess('Today\'s Celebration updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 text-brand-navy">Manage Today's Celebration</h1>
      <form onSubmit={handleSubmit}>
        <Card className="mb-8 bg-white/90 shadow-lg rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-brand-medium-brown">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-caramel" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-brand-medium-brown">Coffee Name</label>
              <input type="text" value={coffeeName} onChange={e => setCoffeeName(e.target.value)} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-caramel" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-brand-medium-brown">Description / Tasting Notes</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-caramel" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-brand-medium-brown">Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full" />
              {image && <img src={image} alt="Preview" className="mt-2 rounded-lg shadow w-full max-h-64 object-cover" />}
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-green-700 text-sm">{success}</div>}
            <Button type="submit" className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg transition" disabled={loading}>
              {loading ? 'Saving...' : 'Save Celebration'}
            </Button>
          </CardContent>
        </Card>
      </form>
      <h2 className="text-xl font-semibold mb-4 text-brand-navy">Preview</h2>
      <div className="flex flex-col md:flex-row bg-white/90 rounded-2xl shadow-lg overflow-hidden">
        {image && (
          <div className="md:w-1/2 w-full flex items-center justify-center bg-brand-cream p-6 fade-in">
            <img src={image} alt="Celebration Coffee" className="rounded-xl shadow-md w-full max-h-80 object-cover" />
          </div>
        )}
        <div className="md:w-1/2 w-full flex flex-col justify-center p-8 fade-in-text">
          <div className="text-xs text-brand-medium-brown mb-2">{new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <h3 className="text-2xl font-bold text-brand-navy mb-2">Today's Celebration</h3>
          <div className="text-xl font-extrabold text-brand-caramel mb-2">{coffeeName}</div>
          <div className="text-brand-medium-brown mb-6">{description}</div>
          <Button className="rounded-full px-8 py-3 text-lg font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg transition">Order Now</Button>
        </div>
      </div>
      <style jsx>{`
        .fade-in { animation: fadeIn 1s ease; }
        .fade-in-text { animation: fadeInText 1.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        @keyframes fadeInText { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
} 