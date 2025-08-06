import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, Save, Upload, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Promo {
  id: string;
  image_url: string;
  promo_text: string;
  active: boolean;
  created_at: string;
  sort_order: number;
}

function PromoManagementInner() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [promoText, setPromoText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/menu-promos?all=true');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setPromos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError("Failed to fetch promos. " + (err.message || ""));
      setPromos([]);
      console.error("PromoManagement fetchPromos error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!imageFile) return toast({ title: "Error", description: "Please select an image.", variant: "destructive" });
    if (promos.length >= 10) return toast({ title: "Limit reached", description: "Maximum 10 promos allowed.", variant: "destructive" });
    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `promo-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('images').upload(`promos/${fileName}`, imageFile, { upsert: false });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(`promos/${fileName}`);
      const image_url = publicUrlData.publicUrl;
      // Save promo to DB
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const res = await fetch('/api/menu-promos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ image_url, promo_text: promoText }),
        credentials: 'include', // Ensure cookies are sent
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to save promo');
      }
      setImageFile(null);
      setPromoText("");
      fetchPromos();
      toast({ title: "Success", description: "Promo added!", variant: "default" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to upload promo.", variant: "destructive" });
      setError("Failed to upload promo. " + (err.message || ""));
      console.error("PromoManagement handleUpload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this promo?")) return;
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const res = await fetch(`/api/menu-promos/${id}`, {
        method: 'DELETE',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete promo');
      fetchPromos();
      toast({ title: "Deleted", description: "Promo deleted.", variant: "default" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete promo.", variant: "destructive" });
      setError("Failed to delete promo. " + (err.message || ""));
      console.error("PromoManagement handleDelete error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const res = await fetch(`/api/menu-promos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ active: !current }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update promo');
      fetchPromos();
      toast({ title: "Updated", description: "Promo status updated.", variant: "default" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update promo.", variant: "destructive" });
      setError("Failed to update promo. " + (err.message || ""));
      console.error("PromoManagement handleToggleActive error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleTextChange = async (id: string, text: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/menu-promos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promo_text: text }),
      });
      if (!res.ok) throw new Error('Failed to update promo text');
      fetchPromos();
      toast({ title: "Updated", description: "Promo text updated.", variant: "default" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update promo text.", variant: "destructive" });
      setError("Failed to update promo text. " + (err.message || ""));
      console.error("PromoManagement handleTextChange error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (promoIds: string[]) => {
    setReordering(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      const res = await fetch('/api/menu-promos/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ promoIds }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to reorder promos');
      }
      
      fetchPromos();
      toast({ title: "Reordered", description: "Promo order updated.", variant: "default" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to reorder promos.", variant: "destructive" });
      setError("Failed to reorder promos. " + (err.message || ""));
      console.error("PromoManagement handleReorder error:", err);
    } finally {
      setReordering(false);
    }
  };

  const movePromo = (fromIndex: number, toIndex: number) => {
    const newPromos = [...promos];
    const [movedPromo] = newPromos.splice(fromIndex, 1);
    newPromos.splice(toIndex, 0, movedPromo);
    setPromos(newPromos);
    
    // Update sort order in database
    const promoIds = newPromos.map(promo => promo.id);
    handleReorder(promoIds);
  };

  return (
    <div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Promo Management</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded font-semibold">{error}</div>
          )}
          <div className="mb-8 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-2">Add New Promo</h3>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">📸 Recommended Image Size:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• <strong>Width:</strong> 800px - 1200px</li>
                <li>• <strong>Height:</strong> 400px - 600px</li>
                <li>• <strong>Aspect Ratio:</strong> 2:1 or 3:1 (landscape)</li>
                <li>• <strong>Format:</strong> JPG, PNG, or WebP</li>
                <li>• <strong>File Size:</strong> Under 500KB</li>
              </ul>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex flex-col items-center">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-2"
                  disabled={uploading || promos.length >= 10}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imageFile ? imageFile.name : "Select Image"}
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={uploading || promos.length >= 10}
                />
                {imageFile && (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded border mt-2"
                  />
                )}
              </div>
              <div className="flex-1 w-full">
                <Label>Promo Text</Label>
                <Textarea
                  value={promoText}
                  onChange={e => setPromoText(e.target.value)}
                  placeholder="Enter promo text (optional)"
                  className="mb-2"
                  rows={2}
                  maxLength={120}
                  disabled={uploading}
                />
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !imageFile || promos.length >= 10}
                  className="bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white"
                >
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Add Promo
                </Button>
              </div>
            </div>
            {promos.length >= 10 && (
              <div className="text-red-600 mt-2 font-semibold">Maximum 10 promos allowed. Delete an existing promo to add more.</div>
            )}
          </div>
          <div className="overflow-x-auto">
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">🔄 Drag and drop the grip handles to reorder promos. The first promo will be shown first in the menu carousel.</p>
            </div>
            <table className="min-w-full border rounded-lg bg-white">
              <thead>
                <tr className="bg-brand-caramel/10">
                  <th className="p-2 border w-12">Order</th>
                  <th className="p-2 border">Image</th>
                  <th className="p-2 border">Promo Text</th>
                  <th className="p-2 border">Active</th>
                  <th className="p-2 border">Created</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown mx-auto" /></td></tr>
                ) : promos.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-brand-medium-brown">No promos found.</td></tr>
                ) : promos.map((promo, index) => (
                  <tr key={promo.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-2 border text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xs font-bold text-brand-navy">{promo.sort_order}</div>
                        <div className="flex flex-col gap-1">
                          {index > 0 && (
                            <button
                              onClick={() => movePromo(index, index - 1)}
                              disabled={reordering}
                              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 disabled:opacity-50"
                              title="Move up"
                            >
                              ↑
                            </button>
                          )}
                          {index < promos.length - 1 && (
                            <button
                              onClick={() => movePromo(index, index + 1)}
                              disabled={reordering}
                              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 disabled:opacity-50"
                              title="Move down"
                            >
                              ↓
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 border text-center">
                      <img src={promo.image_url} alt="Promo" className="w-20 h-20 object-cover rounded mx-auto" />
                    </td>
                    <td className="p-2 border">
                      <Textarea
                        value={promo.promo_text || ""}
                        onChange={e => handleTextChange(promo.id, e.target.value)}
                        rows={2}
                        maxLength={120}
                        className="w-full"
                        disabled={saving}
                      />
                    </td>
                    <td className="p-2 border text-center">
                      <Switch
                        checked={promo.active}
                        onCheckedChange={() => handleToggleActive(promo.id, promo.active)}
                        disabled={saving}
                      />
                    </td>
                    <td className="p-2 border text-center text-xs">{new Date(promo.created_at).toLocaleString()}</td>
                    <td className="p-2 border text-center">
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(promo.id)} disabled={saving}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error boundary wrapper
export default function PromoManagement() {
  const [hasError, setHasError] = useState(false);
  if (hasError) {
    return <div className="p-6 bg-red-100 text-red-800 font-bold rounded">Something went wrong in Promo Management. Please reload the page.</div>;
  }
  try {
    return <PromoManagementInner />;
  } catch (err) {
    // This will only catch errors thrown during rendering, not async errors
    setHasError(true);
    return null;
  }
} 