import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Check,
  Tag,
  Package,
  Sparkles,
  Share2
} from 'lucide-react';
import { ProductItem } from '../types';

interface ProductDetailModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onAddToCart: (product: ProductItem) => void;
  cartQuantity: number;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  cartQuantity
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  if (!product) return null;

  // Build images array
  const allImages = [
    product.imageUrl,
    ...(product.galleryImages || [])
  ].filter(Boolean) as string[];

  const hasImages = allImages.length > 0;
  const currentImage = hasImages ? allImages[activeImageIndex] || allImages[0] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(prev => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in no-print overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border-2 border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="bg-[#0B1E48] text-white p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b-2 border-orange-500">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">🛍️</span>
            <div>
              <h3 className="text-sm sm:text-base font-black truncate">{product.nameGu}</h3>
              <p className="text-[11px] text-orange-300 font-bold truncate">{product.nameEn}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* IMAGE CAROUSEL / GALLERY */}
          <div className="relative bg-neutral-100 rounded-2xl border border-neutral-300 overflow-hidden flex items-center justify-center aspect-4/3 sm:aspect-16/9 group">
            {currentImage ? (
              <img
                src={currentImage}
                alt={product.nameGu}
                className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="text-center p-8 text-neutral-400">
                <Package className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                <span className="font-bold">ફોટો ઉપલબ્ધ નથી</span>
              </div>
            )}

            {/* Carousel Controls (when multiple images) */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center shadow cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center shadow cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute bottom-2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-black/70 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black">
                  {activeImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>

          {/* THUMBNAIL STRIP */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-orange-500 ring-2 ring-orange-400/40'
                      : 'border-neutral-300 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* PRODUCT DETAILS & PRICING */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300 space-y-3">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-orange-600 font-mono">
                  ₹{product.price}
                </span>
                <span className="text-xs font-bold text-neutral-500">
                  / {product.unit}
                </span>
                {product.mrp && product.mrp > product.price && (
                  <span className="text-xs text-neutral-400 line-through font-bold">
                    MRP: ₹{product.mrp}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-black text-[10.5px]">
                  કેટેગરી: {product.category}
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black text-[10.5px]">
                  {typeof product.stock === 'number' ? `સ્ટોક: ${product.stock} ${product.unit}` : 'સેવા ઉપલબ્ધ'}
                </span>
              </div>
            </div>

            {product.bulkPricing && (
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-300 text-amber-950 font-bold text-xs flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-600 shrink-0" />
                <span><b>હોલસેલ ઓફર:</b> {product.bulkPricing}</span>
              </div>
            )}

            {product.description && (
              <div className="text-neutral-700 text-xs font-medium leading-relaxed pt-1">
                {product.description}
              </div>
            )}
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-neutral-100 p-3 sm:p-4 border-t border-neutral-300 flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-neutral-600">
            {cartQuantity > 0 ? (
              <span className="text-emerald-700 font-black">
                ✓ કાર્ટમાં {cartQuantity} નંગ ઉમેરેલ છે
              </span>
            ) : (
              <span>પ્રિષા સ્ટેશનરી થરાદ</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-neutral-200 text-neutral-800 border border-neutral-300 px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
            >
              બંધ કરો
            </button>
            <button
              type="button"
              onClick={() => {
                onAddToCart(product);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-black px-6 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>+ કાર્ટમાં ઉમેરો (Add to Cart)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
