import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Star } from "lucide-react";

interface MenuCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    price: number;
    sale_price?: number | null;
    tags?: string[];
    track_stock?: boolean;
    stock_quantity?: number;
    rating?: number;
    reviews_count?: number;
    category?: string;
    ribbon_text?: string;
    ribbon_color?: string;
    isbestselling?: boolean;
  };
  onAddToCart: () => void;
}

export default function MenuCard({ product, onAddToCart }: MenuCardProps) {
  return (
    <div className="border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white flex flex-col h-full overflow-hidden">
      <div className="relative overflow-hidden">
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-40 object-cover"
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
        
        {/* Best Seller Badge */}
        {product.isbestselling && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
            ⭐ Best Seller
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="mb-2">
            <h3 className="font-semibold text-brand-navy text-lg leading-tight mb-1 min-h-[3rem] flex items-center">{product.name}</h3>
            {product.rating && (
              <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded w-fit">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="text-xs font-medium text-amber-700">{product.rating}</span>
              </div>
            )}
          </div>
          <div className="text-sm text-brand-medium-brown line-clamp-2 mb-3 min-h-[2.5rem]">
            {product.description || "No description available"}
          </div>
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs bg-brand-cream/50 text-brand-caramel border-brand-caramel/20">
                  {tag}
                </Badge>
              ))}
              {product.tags.length > 2 && (
                <Badge variant="outline" className="text-xs bg-brand-cream/50 text-brand-caramel border-brand-caramel/20">
                  +{product.tags.length - 2} more
                </Badge>
              )}
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            {product.sale_price && product.sale_price < product.price ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-red-600 line-through">RM{product.price.toFixed(2)}</span>
                <span className="text-base font-bold text-green-700">RM{product.sale_price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-base font-bold text-brand-navy">RM{product.price.toFixed(2)}</span>
            )}

          </div>
        </div>
        <Button 
          className="w-full mt-auto bg-brand-navy hover:bg-brand-caramel text-white transition-colors" 
          onClick={onAddToCart} 
          disabled={product.track_stock && product.stock_quantity === 0}
        >
          {product.track_stock && product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}