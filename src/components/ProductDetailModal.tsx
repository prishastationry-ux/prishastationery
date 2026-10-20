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
  Share2,
  Star,
  MessageSquare,
  Send
} from 'lucide-react';
import { ProductItem } from '../types';

interface ProductReview {
  id: string;
  name: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
}

interface ProductDetailModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onAddToCart: (product: ProductItem) => void;
  cartQuantity: number;
  relatedProducts?: ProductItem[];
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  cartQuantity,
  relatedProducts
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    if (!product) return [];
    try {
      const saved = localStorage.getItem(`prisha_product_reviews_${product.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'rev-1', name: 'રમેશભાઈ પટેલ', rating: 5, comment: 'ખૂબ જ સરસ ક્વોલિટી છે અને ભાવ પણ યોગ્ય છે!', date: '15/10/2026' },
      { id: 'rev-2', name: 'સુરેશકુમાર', rating: 5, comment: 'ટાઈમસર ડિલિવરી અને પ્રિષા સ્ટેશનરીની સર્વિસ ઉત્તમ.', date: '18/10/2026' }
    ];
  });

  const [newReviewerName, setNewReviewerName] = useState('');
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

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

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0';

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewerName.trim() || !newComment.trim()) {
      alert('કૃપા કરીને તમારું નામ અને રિવ્યૂ કોમેન્ટ બંને લખો.');
      return;
    }
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    
    const newRev: ProductReview = {
      id: `rev-${Date.now()}`,
      name: newReviewerName.trim(),
      rating: newRating,
      comment: newComment.trim(),
      date: dateFormatted
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(`prisha_product_reviews_${product.id}`, JSON.stringify(updated));
    } catch {}

    setNewReviewerName('');
    setNewComment('');
    setShowReviewForm(false);
    setReviewSuccessMsg('✨ તમારો રિવ્યૂ સફળતાપૂર્વક સબમિટ થઈ ગયો છે!');
    setTimeout(() => setReviewSuccessMsg(''), 4000);
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

            {/* Carousel Controls */}
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
                {product.isService || product.category === 'service' ? (
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black text-[10.5px]">
                    ⚡ સેવા ઉપલબ્ધ
                  </span>
                ) : typeof product.stock === 'number' && product.stock <= 0 ? (
                  <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-black text-[10.5px] border border-red-300">
                    ❌ સ્ટોક ખલાસ (Out of Stock)
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black text-[10.5px]">
                    સ્ટોક: {product.stock} {product.unit}
                  </span>
                )}
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

          {/* ========================================================================= */}
          {/* CUSTOMER REVIEWS & 5-STAR RATINGS SECTION */}
          {/* ========================================================================= */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="ml-1 font-black text-sm text-neutral-900">{avgRating} / 5.0</span>
                </div>
                <span className="text-neutral-500 font-bold">({reviews.length} ગ્રાહક રિવ્યૂઝ)</span>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewForm(prev => !prev)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{showReviewForm ? 'રિવ્યૂ બંધ કરો' : '⭐ રિવ્યૂ અને સ્ટાર આપો'}</span>
              </button>
            </div>

            {reviewSuccessMsg && (
              <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-lg font-bold text-xs animate-fade-in">
                {reviewSuccessMsg}
              </div>
            )}

            {/* Add Review Form */}
            {showReviewForm && (
              <form onSubmit={handleAddReview} className="bg-white p-3 rounded-xl border border-amber-300 space-y-3 shadow-sm animate-fade-in">
                <h4 className="font-black text-xs text-neutral-800 flex items-center gap-1">
                  <span>✍️ તમારો અભિપ્રાય અને રેટિંગ લખો</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-1">તમારું નામ (Name):</label>
                    <input
                      type="text"
                      placeholder="દા.ત. કિશનભાઈ"
                      value={newReviewerName}
                      onChange={e => setNewReviewerName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-bold outline-none focus:border-amber-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-1">સ્ટાર રેટિંગ (1 થી 5 Star):</label>
                    <div className="flex items-center gap-1 py-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="focus:outline-none cursor-pointer p-0.5"
                        >
                          <Star className={`w-6 h-6 ${star <= newRating ? 'fill-amber-400 text-amber-500 scale-110' : 'text-neutral-300'} transition-transform`} />
                        </button>
                      ))}
                      <span className="ml-2 font-black text-amber-700 text-sm">{newRating} Star</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">તમારી કોમેન્ટ / રિવ્યૂ:</label>
                  <textarea
                    rows={2}
                    placeholder="વસ્તુ કે સેવાની ગુણવત્તા વિશે તમારો અનુભવ લખો..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium outline-none focus:border-amber-600 resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-3 py-1 bg-neutral-200 text-neutral-700 font-bold rounded-lg text-xs cursor-pointer"
                  >
                    રદ કરો
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>રિવ્યૂ સબમિટ કરો</span>
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {reviews.map(rev => (
                <div key={rev.id} className="bg-white p-2.5 rounded-lg border border-neutral-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-neutral-900">{rev.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="flex text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-500" />
                        ))}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-bold">{rev.date}</span>
                    </div>
                  </div>
                  <p className="text-neutral-700 text-xs font-medium">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RELATED PRODUCTS SECTION */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mt-6 border-t border-neutral-200 pt-4">
              <h4 className="text-sm font-black text-neutral-800 mb-3">આવી જ બીજી વસ્તુઓ (Related Items):</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {relatedProducts.map(rel => (
                  <div key={rel.id} className="bg-neutral-50 rounded-xl p-2 border border-neutral-200 flex flex-col justify-between hover:border-orange-400 transition-colors cursor-pointer">
                    <div>
                      <div className="aspect-square bg-white rounded-lg mb-2 flex items-center justify-center overflow-hidden border border-neutral-100 p-1">
                        {rel.imageUrl ? (
                          <img src={rel.imageUrl} alt={rel.nameGu} className="w-full h-full object-contain" />
                        ) : (
                          <Package className="w-6 h-6 text-neutral-300" />
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-neutral-800 line-clamp-2 leading-tight">{rel.nameGu}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-orange-700">₹{rel.price}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(rel); }}
                        className="bg-orange-500 hover:bg-orange-600 text-black p-1 rounded-md"
                        title="કાર્ટમાં ઉમેરો"
                      >
                        <ShoppingCart className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-neutral-100 p-3 sm:p-4 border-t border-neutral-300 flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-neutral-600">
            {cartQuantity > 0 ? (
              <span className="text-emerald-700 font-black">
                ✓ કાર્ટમાં {cartQuantity} {product.unit || 'નંગ'} ઉમેરેલ છે
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
              disabled={!product.isService && product.category !== 'service' && typeof product.stock === 'number' && product.stock <= 0}
              onClick={() => {
                onAddToCart(product);
              }}
              className={`px-6 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer ${
                !product.isService && product.category !== 'service' && typeof product.stock === 'number' && product.stock <= 0
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-black'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {!product.isService && product.category !== 'service' && typeof product.stock === 'number' && product.stock <= 0
                  ? '❌ સ્ટોક ખલાસ છે'
                  : '+ કાર્ટમાં ઉમેરો (Add to Cart)'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
