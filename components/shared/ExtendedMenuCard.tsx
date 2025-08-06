import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface ProductSize {
  id: string;
  size_name: string;
  price_multiplier: number;
  price_override?: number | null;
  active: boolean;
}

interface AddOn {
  id?: string;
  name: string;
  price: number;
  active: boolean;
}

interface ExtendedMenuCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    detailed_description?: string;
    image_url?: string;
    price: number;
    sale_price?: number | null;
    tags?: string[];
    allergens?: string[];
    dietary_tags?: string[];
    estimated_prep_time?: string;
    track_stock?: boolean;
    stock_quantity?: number;
    ribbon_text?: string;
    ribbon_color?: string;
  };
  sizes: ProductSize[];
  addOns?: AddOn[];
  onAddToCart: (size: string, quantity: number, selectedAddOns: AddOn[]) => void;
}

export default function ExtendedMenuCard({ product, sizes, addOns = [], onAddToCart }: ExtendedMenuCardProps) {
  const [selectedSize, setSelectedSize] = useState(sizes[0]?.size_name || "M");
  const [quantity, setQuantity] = useState(1);
  const basePrice = product.sale_price && product.sale_price < product.price ? product.sale_price : product.price;
  const sizeObj = sizes.find(s => s.size_name === selectedSize);
  const finalPrice = sizeObj?.price_override ?? (basePrice * (sizeObj?.price_multiplier ?? 1));
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);

  const handleToggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns(prev => prev.some(a => a.name === addOn.name)
      ? prev.filter(a => a.name !== addOn.name)
      : [...prev, addOn]);
  };
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);

  return (
    <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
      {/* Image */}
      <div className="flex justify-center items-center">
        <div className="relative overflow-hidden rounded-xl">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full max-w-sm h-48 sm:h-56 md:h-64 object-cover shadow-lg border border-brand-caramel/20"
          />
          {product.ribbon_text && (
            <div 
              className="ribbon"
              style={{ 
                '--c': product.ribbon_color || '#FA6900'
              } as React.CSSProperties & { '--c': string }}
            >
              {product.ribbon_text}
            </div>
          )}
        </div>
      </div>
      {/* Details */}
      <div className="flex flex-col space-y-3">
        {/* Header */}
        <div>
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <h2 className="font-bold text-xl sm:text-2xl text-brand-navy flex-1">{product.name}</h2>
            <div className="flex flex-wrap gap-1">
              {(product.tags ?? []).map(tag => (
                <Badge key={tag} className="bg-brand-navy text-white text-xs">{tag}</Badge>
              ))}
            </div>
          </div>
          {product.estimated_prep_time && (
            <div className="mb-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                ⏱️ Prep: {product.estimated_prep_time}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <p className="text-brand-medium-brown leading-relaxed text-sm sm:text-base">{product.description}</p>
          {product.detailed_description && (
            <p className="text-xs sm:text-sm text-brand-dark-brown leading-relaxed bg-gray-50 p-2 sm:p-3 rounded-lg">
              {product.detailed_description}
            </p>
          )}
        </div>
        
        {/* Allergens & Dietary */}
        {((product.allergens ?? []).length > 0 || (product.dietary_tags ?? []).length > 0) && (
          <div>
            <h4 className="font-medium text-brand-navy mb-2 text-sm">Allergens & Dietary Info</h4>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {(product.allergens ?? []).map(allergen => (
                <Badge key={allergen} className="bg-red-100 text-red-700 border-red-200 text-xs" variant="outline">
                  ⚠️ {allergen}
                </Badge>
              ))}
              {(product.dietary_tags ?? []).map(tag => (
                <Badge key={tag} className="bg-green-100 text-green-700 border-green-200 text-xs" variant="outline">
                  ✓ {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {/* Size Selector */}
        <div>
          <h4 className="font-medium text-brand-navy mb-2 text-sm">Size</h4>
          <div className="grid grid-cols-3 gap-2">
            {sizes.map(size => (
              <button
                key={size.id}
                className={`px-2 py-2 rounded-lg border-2 transition-all font-medium text-xs ${
                  selectedSize === size.size_name 
                    ? "bg-brand-caramel text-white border-brand-caramel shadow-md" 
                    : "bg-white text-brand-navy border-brand-caramel/30 hover:border-brand-caramel hover:bg-brand-caramel/5"
                }`}
                onClick={() => setSelectedSize(size.size_name)}
                type="button"
              >
                <div className="text-center">
                  <div className="font-bold">{size.size_name}</div>
                  <div className="text-xs">
                    {size.price_override
                      ? `RM${size.price_override.toFixed(2)}`
                      : size.price_multiplier !== 1
                      ? `×${size.price_multiplier}`
                      : "Base"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        {/* Add-ons */}
        {addOns.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-brand-navy text-sm">Optional Add-ons</h4>
            <div className="space-y-2">
              {addOns.filter(a => a.active).map(addOn => (
                <label key={addOn.name} className="flex items-center gap-2 border border-brand-caramel/30 rounded-lg px-3 py-2 cursor-pointer hover:bg-brand-caramel/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedAddOns.some(a => a.name === addOn.name)}
                    onChange={() => handleToggleAddOn(addOn)}
                    className="rounded border-brand-caramel text-brand-caramel focus:ring-brand-caramel"
                  />
                  <span className="flex-1 text-sm">{addOn.name}</span>
                  {addOn.price > 0 && <span className="text-xs font-medium text-brand-caramel">+RM{addOn.price.toFixed(2)}</span>}
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Price & Actions Section */}
        <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
          {/* Price Display */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">Base Price ({selectedSize}):</span>
              <span className="font-medium text-sm">RM{finalPrice.toFixed(2)}</span>
            </div>
            {addOnsTotal > 0 && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">Add-ons:</span>
                <span className="font-medium text-sm">RM{addOnsTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-navy text-sm">Total:</span>
                {product.sale_price && product.sale_price < product.price ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-500 line-through">RM{(product.price + addOnsTotal).toFixed(2)}</span>
                    <span className="text-lg font-bold text-green-600">RM{(finalPrice + addOnsTotal).toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-brand-navy">RM{(finalPrice + addOnsTotal).toFixed(2)}</span>
                )}
              </div>
            </div>

          </div>
          
          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-brand-navy">Qty:</label>
              <div className="flex items-center border border-brand-caramel/30 rounded-lg">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2 py-1 text-brand-caramel hover:bg-brand-caramel/10 transition-colors text-sm"
                >
                  -
                </button>
                <span className="px-3 py-1 font-medium text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2 py-1 text-brand-caramel hover:bg-brand-caramel/10 transition-colors text-sm"
                >
                  +
                </button>
              </div>
            </div>
            <Button
              className="flex-1 text-sm py-4 rounded-lg bg-brand-navy text-white font-bold hover:bg-brand-caramel transition-colors shadow-lg"
              disabled={product.track_stock && product.stock_quantity === 0}
              onClick={() => onAddToCart(selectedSize, quantity, selectedAddOns)}
              type="button"
            >
              {product.track_stock && product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}