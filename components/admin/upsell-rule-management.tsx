import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Trash2, Save, X, Lightbulb } from "lucide-react";

type UpsellRule = {
  id: string;
  trigger_product: string;
  suggested_product: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const defaultForm: Partial<UpsellRule> = {
  trigger_product: "",
  suggested_product: "",
  description: "",
  active: true,
};

export default function UpsellRuleManagement() {
  const [upsellRules, setUpsellRules] = useState<UpsellRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<UpsellRule | null>(null);
  const [form, setForm] = useState<Partial<UpsellRule>>(defaultForm);

  useEffect(() => {
    fetchUpsellRules();
  }, []);

  const fetchUpsellRules = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("upsell_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUpsellRules(data || []);
    } catch (err: any) {
      setError("Failed to fetch upsell rules");
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

  const handleEdit = (rule: UpsellRule) => {
    setEditing(rule);
    setForm({
      trigger_product: rule.trigger_product,
      suggested_product: rule.suggested_product,
      description: rule.description || "",
      active: rule.active,
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this upsell rule?")) return;
    setSaving(true);
    setError("");
    try {
      const { error } = await supabase.from("upsell_rules").delete().eq("id", id);
      if (error) throw error;
      setSuccess("Upsell rule deleted.");
      fetchUpsellRules();
      resetForm();
    } catch (err: any) {
      setError("Failed to delete upsell rule");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.trigger_product || !form.suggested_product) {
      setError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        trigger_product: form.trigger_product,
        suggested_product: form.suggested_product,
        description: form.description || null,
        active: !!form.active,
      };
      if (editing) {
        const { error } = await supabase
          .from("upsell_rules")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        setSuccess("Upsell rule updated.");
      } else {
        const { error } = await supabase.from("upsell_rules").insert([payload]);
        if (error) throw error;
        setSuccess("Upsell rule created.");
      }
      fetchUpsellRules();
      resetForm();
    } catch (err: any) {
      setError("Failed to save upsell rule");
    } finally {
      setSaving(false);
    }
  };

  const toggleRuleStatus = async (id: string, currentStatus: boolean) => {
    setSaving(true);
    setError("");
    try {
      const { error } = await supabase
        .from("upsell_rules")
        .update({ active: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      setSuccess(`Upsell rule ${!currentStatus ? "activated" : "deactivated"}!`);
      fetchUpsellRules();
    } catch (err: any) {
      setError("Failed to update rule status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Upsell Rule Form */}
      <Card className="bg-white border-brand-caramel/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-brand-navy flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            {editing ? "Edit Upsell Rule" : "Create Upsell Rule"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              {success}
            </div>
          )}

          <div>
            <Label htmlFor="triggerProduct" className="text-brand-navy font-medium">
              Trigger Product *
            </Label>
            <Input
              id="triggerProduct"
              value={form.trigger_product || ""}
              onChange={(e) =>
                setForm({ ...form, trigger_product: e.target.value })
              }
              placeholder="e.g., Americano"
              className="border-brand-caramel/30 focus:border-brand-caramel"
            />
          </div>

          <div>
            <Label htmlFor="suggestedProduct" className="text-brand-navy font-medium">
              Suggested Product *
            </Label>
            <Input
              id="suggestedProduct"
              value={form.suggested_product || ""}
              onChange={(e) =>
                setForm({ ...form, suggested_product: e.target.value })
              }
              placeholder="e.g., Banana Muffin"
              className="border-brand-caramel/30 focus:border-brand-caramel"
            />
          </div>

          <div>
            <Label htmlFor="ruleDescription" className="text-brand-navy font-medium">
              Description
            </Label>
            <Textarea
              id="ruleDescription"
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Describe why this is a good combination..."
              className="border-brand-caramel/30 focus:border-brand-caramel"
              rows={3}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editing ? "Update" : "Create"} Rule
                </>
              )}
            </Button>
            {editing && (
              <Button onClick={resetForm} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upsell Rules List */}
      <Card className="bg-white border-brand-caramel/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-brand-navy">
            Current Rules ({upsellRules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
            </div>
          ) : (
            <div className="space-y-4">
              {upsellRules.map((rule) => (
                <div
                  key={rule.id}
                  className="border border-brand-caramel/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-brand-navy">
                        {rule.trigger_product}
                      </h3>
                      <span className="text-brand-medium-brown">→</span>
                      <h3 className="font-semibold text-brand-caramel">
                        {rule.suggested_product}
                      </h3>
                      <Badge
                        className={`${
                          rule.active ? "bg-green-500" : "bg-gray-500"
                        } text-white`}
                      >
                        {rule.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRuleStatus(rule.id, rule.active)}
                        className={
                          rule.active
                            ? "text-red-600 hover:text-red-700"
                            : "text-green-600 hover:text-green-700"
                        }
                      >
                        {rule.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-brand-medium-brown">
                    {rule.description}
                  </p>
                </div>
              ))}
              {upsellRules.length === 0 && (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-brand-medium-brown mx-auto mb-4" />
                  <p className="text-brand-medium-brown">No upsell rules found</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 