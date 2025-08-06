import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Edit, Trash2, Save, X } from "lucide-react";

const ORDER_TYPES = [
  { label: "Dine-In", value: "dine_in" },
  { label: "Takeaway", value: "takeaway" },
  { label: "Reservation", value: "reservation" },
];

type DiscountCode = {
  id: string;
  code: string;
  type: "fixed" | "percentage";
  value: number;
  description: string;
  active: boolean;
  usage_limit: number | null;
  usage_count: number;
  min_order_amount: number | null;
  expires_at: string | null;
  applies_to: string[];
  created_at: string;
  updated_at: string;
};

const defaultForm: Partial<DiscountCode> = {
  code: "",
  type: "fixed",
  value: 0,
  description: "",
  active: true,
  usage_limit: null,
  min_order_amount: null,
  expires_at: "",
  applies_to: ["dine_in", "takeaway", "reservation"],
};

export default function DiscountManagement() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<DiscountCode | null>(null);
  const [form, setForm] = useState<Partial<DiscountCode>>(defaultForm);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setDiscounts(data || []);
    } catch (err: any) {
      setError("Failed to fetch discount codes");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditing(null);
    setError("");
    setSuccess("");
  };

  const handleEdit = (discount: DiscountCode) => {
    setEditing(discount);
    setForm({ ...discount, expires_at: discount.expires_at ? discount.expires_at.slice(0, 16) : "" });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this discount code?")) return;
    setSaving(true);
    setError("");
    try {
      const { error } = await supabase.from("discount_codes").delete().eq("id", id);
      if (error) throw error;
      setSuccess("Discount code deleted.");
      fetchDiscounts();
      resetForm();
    } catch (err: any) {
      setError("Failed to delete discount code");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.code || !form.type || !form.value || !form.applies_to || form.applies_to.length === 0) {
      setError("Please fill in all required fields and select at least one order type.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        applies_to: form.applies_to,
        active: !!form.active,
      };
      if (editing) {
        const { error } = await supabase.from("discount_codes").update(payload).eq("id", editing.id);
        if (error) throw error;
        setSuccess("Discount code updated.");
      } else {
        const { error } = await supabase.from("discount_codes").insert([payload]);
        if (error) throw error;
        setSuccess("Discount code created.");
      }
      fetchDiscounts();
      resetForm();
    } catch (err: any) {
      setError("Failed to save discount code");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Discount Codes Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Form */}
        <div className="mb-8 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">{editing ? "Edit Discount Code" : "Add New Discount Code"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Code *</Label>
              <Input value={form.code || ""} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. TAKE10" />
            </div>
            <div>
              <Label>Type *</Label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as "fixed" | "percentage" }))} className="w-full border rounded p-2">
                <option value="fixed">Fixed (RM)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <Label>Value *</Label>
              <Input type="number" min={0} value={form.value ?? ""} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} placeholder="e.g. 10" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
            </div>
            <div>
              <Label>Usage Limit</Label>
              <Input type="number" min={0} value={form.usage_limit ?? ""} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 100" />
            </div>
            <div>
              <Label>Min Order Amount</Label>
              <Input type="number" min={0} value={form.min_order_amount ?? ""} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 50" />
            </div>
            <div>
              <Label>Expires At</Label>
              <Input type="datetime-local" value={form.expires_at || ""} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
            <div>
              <Label>Order Types *</Label>
              <div className="flex gap-4 mt-1">
                {ORDER_TYPES.map(type => (
                  <label key={type.value} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={form.applies_to?.includes(type.value) || false}
                      onChange={e => {
                        setForm(f => ({
                          ...f,
                          applies_to: e.target.checked
                            ? [...(f.applies_to || []), type.value]
                            : (f.applies_to || []).filter(v => v !== type.value),
                        }))
                      }}
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Switch checked={!!form.active} onCheckedChange={checked => setForm(f => ({ ...f, active: checked }))} />
              <Label>Active</Label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving} className="bg-brand-dark-brown text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editing ? "Update" : "Create"}
            </Button>
            {editing && (
              <Button onClick={resetForm} variant="outline"><X className="h-4 w-4" />Cancel</Button>
            )}
          </div>
          {error && <div className="text-red-600 mt-2">{error}</div>}
          {success && <div className="text-green-600 mt-2">{success}</div>}
        </div>
        {/* List */}
        <div>
          <h3 className="font-semibold mb-2">Existing Discount Codes</h3>
          {loading ? (
            <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Loading...</div>
          ) : discounts.length === 0 ? (
            <div className="text-gray-500">No discount codes found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Code</th>
                    <th className="p-2 border">Type</th>
                    <th className="p-2 border">Value</th>
                    <th className="p-2 border">Order Types</th>
                    <th className="p-2 border">Active</th>
                    <th className="p-2 border">Usage</th>
                    <th className="p-2 border">Min Order</th>
                    <th className="p-2 border">Expires</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((d) => (
                    <tr key={d.id} className="border-b">
                      <td className="p-2 border font-bold">{d.code}</td>
                      <td className="p-2 border">{d.type}</td>
                      <td className="p-2 border">{d.type === "percentage" ? `${d.value}%` : `RM${d.value.toFixed(2)}`}</td>
                      <td className="p-2 border">{d.applies_to?.join(", ")}</td>
                      <td className="p-2 border">{d.active ? "Yes" : "No"}</td>
                      <td className="p-2 border">{d.usage_count}{d.usage_limit ? ` / ${d.usage_limit}` : ""}</td>
                      <td className="p-2 border">{d.min_order_amount ? `RM${d.min_order_amount}` : "-"}</td>
                      <td className="p-2 border">{d.expires_at ? new Date(d.expires_at).toLocaleString() : "-"}</td>
                      <td className="p-2 border">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(d)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" className="text-red-600 ml-2" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 