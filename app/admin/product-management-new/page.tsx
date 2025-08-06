"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

// Dummy categories for now
const categories = [
  { id: "hot", name: "Hot" },
  { id: "cold", name: "Cold" },
  { id: "seasonal", name: "Seasonal" },
  { id: "dessert", name: "Dessert" },
];

// Dummy tags and allergens
const tagOptions = ["New", "Bestseller", "Vegan", "Gluten-Free", "Spicy"];
const allergenOptions = ["Dairy", "Nuts", "Gluten", "Soy", "Eggs"];

interface Product {
  id: string;
  name: string;
  description: string;
  detailed_description: string;
  price: number;
  sale_price?: number;
  image_url: string;
  category: string;
  tags: string[];
  allergens: string[];
  sort_order: number;
  track_stock: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  active: boolean;
  ribbon_text?: string;
  ribbon_color?: string;
  rating: number;
  reviews_count: number;
  isbestselling?: boolean;
}

interface ProductSize {
  id?: string;
  product_id?: string;
  size_name: 'S' | 'M' | 'L' | 'XL';
  price_multiplier: number;
  price_override?: number | null;
  active: boolean;
}

const sizeOptions = ['S', 'M', 'L', 'XL'];

export default function ProductManagementNewPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({
    name: "",
    description: "",
    detailed_description: "",
    price: 0,
    sale_price: undefined,
    image_url: "",
    category: "",
    tags: [],
    allergens: [],
    sort_order: 0,
    track_stock: true,
    stock_quantity: 0,
    low_stock_threshold: 10,
    active: true,
    ribbon_text: "",
    ribbon_color: "#ef4444",
    rating: 4.5,
    reviews_count: 0,
    isbestselling: false,
  });
  const [showAllergens, setShowAllergens] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newAllergen, setNewAllergen] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [sizeForm, setSizeForm] = useState<Partial<ProductSize>>({ size_name: 'M', price_multiplier: 1, price_override: undefined, active: true });
  const [prepTime, setPrepTime] = useState("");
  const [addOns, setAddOns] = useState<{ id?: string; name: string; price: number; active: boolean }[]>([]);
  const [addOnForm, setAddOnForm] = useState<{ name: string; price: number; active: boolean }>({ name: "", price: 0, active: true });
  const [showRibbon, setShowRibbon] = useState(false);



  // Fetch products and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Fetch sizes when editing a product
  useEffect(() => {
    if (editingProduct?.id) {
      fetchSizes(editingProduct.id);
      fetchAddOns(editingProduct.id);
    } else {
      setSizes([]);
      setAddOns([]);
    }
  }, [editingProduct?.id]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("sort_order");
    if (error) {
      toast({ title: "Error", description: "Failed to fetch products", variant: "destructive" });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("id, name").order("name");
    if (!error && data) setCategories(data);
  };

  const fetchSizes = async (productId: string) => {
    const { data, error } = await supabase.from('product_sizes').select('*').eq('product_id', productId).order('size_name');
    if (error) {
      console.error('Error fetching sizes:', error);
      setSizes([]);
    } else {
      setSizes(data || []);
    }
  };

  const fetchAddOns = async (productId: string) => {
    const { data, error } = await supabase.from('product_add_ons').select('*').eq('product_id', productId).order('name');
    if (error) {
      console.error('Error fetching add-ons:', error);
      setAddOns([]);
    } else {
      setAddOns(data || []);
    }
  };

  // Image upload helper
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `products/${Date.now()}.${fileExt}`;
    setUploadingImage(true);
    const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file, { upsert: false });
    setUploadingImage(false);
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  // Handlers
  const handleChange = (field: keyof Product, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !(form.tags || []).includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...(prev.tags || []), tag] }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: (prev.tags || []).filter((t) => t !== tag) }));
  };

  const handleAddAllergen = () => {
    const allergen = newAllergen.trim();
    if (allergen && !(form.allergens || []).includes(allergen)) {
      setForm((prev) => ({ ...prev, allergens: [...(prev.allergens || []), allergen] }));
      setNewAllergen("");
    }
  };

  const handleRemoveAllergen = (allergen: string) => {
    setForm((prev) => ({ ...prev, allergens: (prev.allergens || []).filter((a) => a !== allergen) }));
  };

  const handleAllergensInput = (value: string) => {
    setForm((prev) => ({ ...prev, allergens: value.split(",").map(a => a.trim()).filter(Boolean) }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setForm((prev) => ({ ...prev, image_url: URL.createObjectURL(e.target.files![0]) }));
    }
  };

  const handleAddSize = () => {
    if (!sizeForm.size_name) return;
    if (sizes.some(s => s.size_name === sizeForm.size_name)) return toast({ title: 'Error', description: 'Size already exists', variant: 'destructive' });
    setSizes(prev => [...prev, { ...sizeForm, id: crypto.randomUUID(), active: true } as ProductSize]);
    setSizeForm({ size_name: 'M', price_multiplier: 1, price_override: undefined, active: true });
  };

  const handleRemoveSize = (id?: string) => {
    setSizes(prev => prev.filter(s => s.id !== id));
  };

  const handleSizeChange = (id: string | undefined, field: keyof ProductSize, value: any) => {
    setSizes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAddAddOn = () => {
    if (!addOnForm.name) return;
    setAddOns(prev => [...prev, { ...addOnForm }]);
    setAddOnForm({ name: "", price: 0, active: true });
  };
  const handleRemoveAddOn = (name: string) => {
    setAddOns(prev => prev.filter(a => a.name !== name));
  };
  const handleAddOnChange = (idx: number, field: string, value: any) => {
    setAddOns(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.category) return toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
    let imageUrl = form.image_url;
    try {
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const productData = {
        ...form,
        image_url: imageUrl,
        tags: form.tags || [],
        allergens: form.allergens || [],
        sale_price: form.sale_price || null,
        sort_order: form.sort_order || 0,
        stock_quantity: form.stock_quantity || 0,
        low_stock_threshold: form.low_stock_threshold || 10,
        track_stock: form.track_stock ?? true,
        active: form.active ?? true,
        detailed_description: form.detailed_description || "",
        estimated_prep_time: prepTime || null,
        ribbon_text: form.ribbon_text || null,
        ribbon_color: form.ribbon_color || null,
        rating: form.rating || 4.5,
        reviews_count: form.reviews_count || 0,
        isbestselling: form.isbestselling ?? false,
      };
      let productId = editingProduct?.id;
      if (editingProduct) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id);
        if (error) throw error;
        productId = editingProduct.id;
        toast({ title: "Success", description: "Product updated!", variant: "default" });
      } else {
        const { data, error } = await supabase.from("products").insert([productData]).select();
        if (error) throw error;
        productId = data?.[0]?.id;
        toast({ title: "Success", description: "Product added!", variant: "default" });
      }
      if (productId) await upsertSizes(productId);
      if (productId) await upsertAddOns(productId);
      setForm({
        name: "",
        description: "",
        detailed_description: "",
        price: 0,
        sale_price: undefined,
        image_url: "",
        category: "",
        tags: [],
        allergens: [],
        sort_order: 0,
        track_stock: true,
        stock_quantity: 0,
        low_stock_threshold: 10,
        active: true,
        ribbon_text: "",
        ribbon_color: "#ef4444",
        rating: 4.5,
        reviews_count: 0,
        isbestselling: false,
      });
      setImageFile(null);
      setEditingProduct(null);
      setSizes([]);
      setAddOns([]);
      fetchProducts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save product", variant: "destructive" });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm(product);
    setImageFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    await supabase.from('product_sizes').delete().eq('product_id', id);
    await supabase.from('product_add_ons').delete().eq('product_id', id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to delete product", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Product deleted!", variant: "default" });
      fetchProducts();
    }
    if (editingProduct?.id === id) {
      setEditingProduct(null);
      setForm({
        name: "",
        description: "",
        detailed_description: "",
        price: 0,
        sale_price: undefined,
        image_url: "",
        category: "",
        tags: [],
        allergens: [],
        sort_order: 0,
        track_stock: true,
        stock_quantity: 0,
        low_stock_threshold: 10,
        active: true,
        ribbon_text: "",
        ribbon_color: "#ef4444",
        rating: 4.5,
        reviews_count: 0,
        isbestselling: false,
      });
      setImageFile(null);
      setSizes([]);
      setAddOns([]);
    }
  };

  // Upsert sizes for the product
  const upsertSizes = async (productId: string) => {
    // First, delete all existing sizes for this product
    await supabase.from('product_sizes').delete().eq('product_id', productId);
    
    // Then insert all current sizes
    if (sizes.length > 0) {
      const sizesToInsert = sizes.map(size => ({
        id: crypto.randomUUID(),
        product_id: productId,
        size_name: size.size_name,
        price_multiplier: size.price_multiplier,
        price_override: size.price_override === undefined ? null : size.price_override,
        active: size.active ?? true,
      }));
      
      const { error } = await supabase.from('product_sizes').insert(sizesToInsert);
      if (error) {
        console.error('Error inserting sizes:', error);
        throw error;
      }
    }
  };

  const upsertAddOns = async (productId: string) => {
    // First, delete all existing add-ons for this product
    await supabase.from('product_add_ons').delete().eq('product_id', productId);
    
    // Then insert all current add-ons
    if (addOns.length > 0) {
      const addOnsToInsert = addOns.map(addOn => ({
        id: crypto.randomUUID(),
        product_id: productId,
        name: addOn.name,
        price: addOn.price,
        active: addOn.active ?? true,
      }));
      
      const { error } = await supabase.from('product_add_ons').insert(addOnsToInsert);
      if (error) {
        console.error('Error inserting add-ons:', error);
        throw error;
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Card className="bg-white border-brand-caramel/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-brand-navy flex items-center">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Product Name *</Label>
            <Input value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="e.g., Cappuccino" />
          </div>
          <div>
            <Label>Short Description</Label>
            <Input value={form.description} onChange={e => handleChange("description", e.target.value)} placeholder="Short description..." />
          </div>
          <div>
            <Label>Detailed Description</Label>
            <Textarea value={form.detailed_description} onChange={e => handleChange("detailed_description", e.target.value)} placeholder="Full details, flavor notes, etc." rows={3} />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label>Price (RM) *</Label>
              <Input type="number" value={form.price ?? 0} onChange={e => handleChange("price", parseFloat(e.target.value) || 0)} placeholder="0.00" />
            </div>
            <div className="flex-1">
              <Label>Sale Price (Discount)</Label>
              <Input type="number" value={form.sale_price ?? ""} onChange={e => handleChange("sale_price", e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0.00" />
            </div>
          </div>
          <div>
            <Label>Product Rating</Label>
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer transition-colors ${
                      star <= (form.rating || 0) ? "text-yellow-500 fill-current" : "text-gray-300"
                    } hover:text-yellow-400`}
                    onClick={() => handleChange("rating", star)}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 ml-2">
                {form.rating ? `${form.rating} star${form.rating > 1 ? 's' : ''}` : 'No rating'}
              </span>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating || 0}
                onChange={e => handleChange("rating", parseFloat(e.target.value) || 0)}
                className="w-20 ml-2"
                placeholder="4.5"
              />
            </div>
          </div>
          <div>
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={val => handleChange("category", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mt-1 mb-2">
              {(form.tags ?? []).map(tag => (
                <Badge key={tag} className="bg-brand-navy text-white text-xs cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                  {tag} <span className="ml-1">×</span>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
              />
              <Button type="button" onClick={handleAddTag}>Add</Button>
            </div>
          </div>
          <div>
            {!showRibbon ? (
              <Button type="button" variant="outline" onClick={() => setShowRibbon(true)}>
                Add Ribbon Badge
              </Button>
            ) : (
              <div className="space-y-3">
                <Label>Ribbon Badge</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-sm">Ribbon Text</Label>
                    <Input
                      value={form.ribbon_text || ""}
                      onChange={e => handleChange("ribbon_text", e.target.value)}
                      placeholder="e.g., NEW, HOT, SPECIAL"
                      maxLength={10}
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-sm">Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={form.ribbon_color || "#FF6B6B"}
                        onChange={e => handleChange("ribbon_color", e.target.value)}
                        className="w-12 h-8 p-1 border rounded cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={form.ribbon_color || ""}
                        onChange={e => handleChange("ribbon_color", e.target.value)}
                        placeholder="#FF6B6B"
                        className="flex-1 text-xs"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
                {form.ribbon_text && (
                  <div className="p-3 bg-gray-50 rounded border">
                    <Label className="text-sm text-gray-600">Preview:</Label>
                    <div className="relative w-32 h-20 bg-white border rounded mt-2">
                      <div 
                        className="absolute -left-1 top-2 px-1 py-3 text-white text-xs font-bold transform -rotate-45 origin-top-left shadow-md"
                        style={{ 
                          backgroundColor: form.ribbon_color,
                          width: '60px',
                          textAlign: 'center',
                          fontSize: '8px'
                        }}
                      >
                        {form.ribbon_text}
                      </div>
                    </div>
                  </div>
                )}
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => { 
                    setShowRibbon(false); 
                    handleChange("ribbon_text", ""); 
                    handleChange("ribbon_color", "#ef4444"); 
                  }}
                >
                  Remove Ribbon
                </Button>
              </div>
            )}
          </div>
          <div>
            {!showAllergens ? (
              <Button type="button" variant="outline" onClick={() => setShowAllergens(true)}>
                Add Allergens
              </Button>
            ) : (
              <div className="space-y-2">
                <Label>Allergens</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(form.allergens ?? []).map(allergen => (
                    <Badge key={allergen} className="bg-red-500 text-white text-xs cursor-pointer" onClick={() => handleRemoveAllergen(allergen)}>
                      {allergen} <span className="ml-1">×</span>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newAllergen}
                    onChange={e => setNewAllergen(e.target.value)}
                    placeholder="Add an allergen"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddAllergen(); } }}
                  />
                  <Button type="button" onClick={handleAddAllergen}>Add</Button>
                </div>
                <Button type="button" variant="ghost" onClick={() => { setShowAllergens(false); setForm(prev => ({ ...prev, allergens: [] })); }}>
                  Remove Allergens
                </Button>
              </div>
            )}
          </div>
          <div>
            <Label>Sizes</Label>
            <div className="space-y-2 mb-2">
              {sizes.map(size => (
                <div key={size.id} className="flex items-center gap-2">
                  <Select value={size.size_name} onValueChange={val => handleSizeChange(size.id, 'size_name', val)}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sizeOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" className="w-24" value={size.price_multiplier} min={0.1} step={0.01} onChange={e => handleSizeChange(size.id, 'price_multiplier', parseFloat(e.target.value) || 1)} placeholder="Multiplier" />
                  <Input type="number" className="w-28" value={size.price_override ?? ''} min={0} step={0.01} onChange={e => handleSizeChange(size.id, 'price_override', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Override (optional)" />
                  <Switch checked={size.active} onCheckedChange={val => handleSizeChange(size.id, 'active', val)} />
                  <Button type="button" size="sm" variant="outline" onClick={() => handleRemoveSize(size.id)}>Remove</Button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Select value={sizeForm.size_name} onValueChange={val => setSizeForm(f => ({ ...f, size_name: val as any }))}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sizeOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" className="w-24" value={sizeForm.price_multiplier ?? 1} min={0.1} step={0.01} onChange={e => setSizeForm(f => ({ ...f, price_multiplier: parseFloat(e.target.value) || 1 }))} placeholder="Multiplier" />
              <Input type="number" className="w-28" value={sizeForm.price_override ?? ''} min={0} step={0.01} onChange={e => setSizeForm(f => ({ ...f, price_override: e.target.value ? parseFloat(e.target.value) : undefined }))} placeholder="Override (optional)" />
              <Button type="button" size="sm" onClick={handleAddSize}>Add Size</Button>
            </div>
          </div>
          <div>
            <Label>Estimated Prep Time</Label>
            <Input value={prepTime} onChange={e => setPrepTime(e.target.value)} placeholder="e.g., 5 min, 10-15 min" />
          </div>
          <div>
            <Label>Add-ons</Label>
            <div className="space-y-2 mb-2">
              {addOns.map((addOn, idx) => (
                <div key={addOn.name} className="flex items-center gap-2">
                  <Input className="w-32" value={addOn.name} onChange={e => handleAddOnChange(idx, 'name', e.target.value)} placeholder="Add-on name" />
                  <Input className="w-24" type="number" value={addOn.price} min={0} step={0.01} onChange={e => handleAddOnChange(idx, 'price', parseFloat(e.target.value) || 0)} placeholder="Price" />
                  <Button type="button" size="sm" variant="outline" onClick={() => handleRemoveAddOn(addOn.name)}>Remove</Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input className="w-32" value={addOnForm.name} onChange={e => setAddOnForm(f => ({ ...f, name: e.target.value }))} placeholder="Add-on name" />
              <Input className="w-24" type="number" value={addOnForm.price} min={0} step={0.01} onChange={e => setAddOnForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} placeholder="Price" />
              <Button type="button" size="sm" onClick={handleAddAddOn}>Add Add-on</Button>
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order ?? 0} onChange={e => handleChange("sort_order", parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex-1">
              <Label>Stock Quantity</Label>
              <Input type="number" value={form.stock_quantity ?? 0} onChange={e => handleChange("stock_quantity", parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex-1">
              <Label>Low Stock Threshold</Label>
              <Input type="number" value={form.low_stock_threshold ?? 10} onChange={e => handleChange("low_stock_threshold", parseInt(e.target.value) || 10)} />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Switch checked={form.track_stock} onCheckedChange={val => handleChange("track_stock", val)} />
            <Label>Track Stock</Label>
            <Switch checked={form.active} onCheckedChange={val => handleChange("active", val)} />
            <Label>Active</Label>
            <Switch checked={form.isbestselling} onCheckedChange={val => handleChange("isbestselling", val)} />
            <Label>Most Popular Items</Label>
          </div>
          <div>
            <Label>Product Image</Label>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                {imageFile ? imageFile.name : "Select Image"}
              </Button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                disabled={uploadingImage}
              />
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="w-16 h-16 object-cover rounded border" />
              )}
            </div>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleSubmit} disabled={uploadingImage || loading}>{editingProduct ? "Update" : "Add"} Product</Button>
            {editingProduct && (
              <Button variant="outline" onClick={() => { setEditingProduct(null); setForm({ name: "", description: "", detailed_description: "", price: 0, sale_price: undefined, image_url: "", category: "", tags: [], allergens: [], sort_order: 0, track_stock: true, stock_quantity: 0, low_stock_threshold: 10, active: true, ribbon_text: "", ribbon_color: "#ef4444", rating: 4.5, reviews_count: 0, isbestselling: false, }); setImageFile(null); setSizes([]); setAddOns([]); setPrepTime(""); }}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border-brand-caramel/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-brand-navy">Current Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="border border-brand-caramel/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-3">
                  <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-12 h-12 object-cover rounded" />
                  <div>
                    <h3 className="font-semibold text-brand-navy">{product.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(product.tags ?? []).map(tag => (
                        <Badge key={tag} className="bg-brand-navy text-white text-xs">{tag}</Badge>
                      ))}
                    </div>
                    <div className="text-sm text-brand-medium-brown line-clamp-1">{product.description}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1 mt-2 md:mt-0">
                  <div className="flex items-center space-x-2">
                    {product.sale_price && product.sale_price < product.price ? (
                      <>
                        <span className="text-lg font-bold text-red-600 line-through">RM{product.price.toFixed(2)}</span>
                        <span className="text-lg font-bold text-green-700">RM{product.sale_price.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-brand-navy">RM{product.price.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(product.allergens ?? []).map(allergen => (
                      <Badge key={allergen} className="bg-red-500 text-white text-xs">{allergen}</Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-700">Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}