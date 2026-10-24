import React, { useState, useEffect } from 'react';
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
import { ProductItem, StoreSettings } from '../types';

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
  onSelectProduct?: (product: ProductItem) => void;
  storeSettings?: StoreSettings;
  isAdminUnlocked?: boolean;
}

// Pool of realistic local customer usernames with handles and numbers
const REVIEWER_HANDLES = [
  'bharat 123', 'ramesh128', 'vikram_thakor', 'jignesh45', 'praveen99',
  'rahul_patel', 'alpesh_vav', 'sanjay_darji21', 'kailash_thavad', 'haresh_babu07',
  'chirag_77', 'devraj_01', 'priya_k_94', 'naresh_rabari', 'ashok_g55',
  'kamlesh88', 'bhavin_42', 'rajesh_sharma12', 'dinesh_v9', 'sunil_patel03',
  'anil_vav7', 'mukesh_thakor', 'govind_bhai82', 'jagdish_j9', 'hitesh_chaudhary',
  'manish_m8', 'arvind_k90', 'paresh_71', 'vipul_v89', 'kanti_bhai33',
  'lalit_kumar7', 'nayan_patel24', 'chetan_thakor', 'mahesh_babu55', 'sandip_vav11',
  'vishal_108', 'ajay_rathod3', 'hardik_92', 'deepak_thakor05', 'vijay_patel77'
];

// Diverse staggered dates across recent days and weeks
const REVIEW_DATES = [
  '21/10/2026', '20/10/2026', '19/10/2026', '18/10/2026', '17/10/2026',
  '16/10/2026', '15/10/2026', '14/10/2026', '13/10/2026', '12/10/2026',
  '11/10/2026', '10/10/2026', '09/10/2026', '08/10/2026', '07/10/2026',
  '06/10/2026', '05/10/2026', '04/10/2026', '03/10/2026', '02/10/2026',
  '01/10/2026', '29/09/2026', '28/09/2026', '26/09/2026', '24/09/2026',
  '22/09/2026', '19/09/2026', '17/09/2026', '15/09/2026', '12/09/2026'
];

// Category-specific natural Gujarati feedback pools
const NOTEBOOK_COMMENTS = [
  'પેજની ક્વોલિટી એકદમ વ્હાઇટ અને જાડી છે, શાહી પાછળ ઉપસતી નથી. બેસ્ટ નોટબુક!',
  'બાળકોના અભ્યાસ માટે હોલસેલ ભાવે 1 ડઝન લીધી, બજાર કરતાં ઘણો ફાયદો થયો.',
  'બાઇન્ડિંગ મજબૂત છે અને પેજ નીકળતા નથી. Classmate જેવી A-વન ક્વોલિટી!',
  'કાગળ એકદમ સોફ્ટ છે, પેન ફટાફટ સ્મૂથ દોડે છે. વિદ્યાર્થીઓ માટે ઉત્તમ ચોપડા.',
  'માર્કેટ કરતાં ₹15 થી ₹20 સસ્તા ભાવે મળ્યા. પ્રિષા સ્ટેશનરીનું કલેક્શન બેસ્ટ છે.',
  'લાઈનિંગ અને માર્જિન એકદમ પરફેક્ટ છે. ફરીથી અહીંથી જ ઓર્ડર કરીશ.',
  'કવર પેજ ટકાઉ છે અને પેકિંગ પણ ઘણું મજબૂત આવ્યું. ખૂબ જ સંતોષકારક!'
];

const PEN_COMMENTS = [
  'રાઇટિંગ સ્પીડ બહુ સારી આવે છે અને શાહી લીક થતી નથી. એક્ઝામ માટે બેસ્ટ પેન!',
  'આખું પેકેટ વ્યાજબી ભાવમાં મળ્યું, પેન પકડવામાં ગ્રિપ બહુ કમ્ફર્ટેબલ છે.',
  'લાંબા સમય સુધી સ્મૂથ ચાલે છે. પ્રિષા સ્ટેશનરીની તમામ પેન બહુ સરસ હોય છે.',
  'ડાર્ક અને બ્લુ ઇંક એકદમ સરસ ઉપસે છે, પેપર પર જરાય ડાઘા પડતા નથી.',
  'હસ્તાક્ષર સારા આવે છે અને હાથ દુખતો નથી. રેગ્યુલર યુઝ માટે ખૂબ સારો વિકલ્પ.',
  'હોલસેલ રેટમાં આખો બોક્સ મળી ગયો. ભાવ અને ગુણવત્તા બંને બેસ્ટ!',
  'વોટરપ્રૂફ ઇંક છે અને ફ્લો સારો છે. 5 સ્ટાર ક્વોલિટી પેન.'
];

const PAPER_COMMENTS = [
  '75 GSM પેપર પ્રિન્ટરમાં જરાય ફસાતો નથી. ઝેરોક્ષ અને પ્રિન્ટિંગ બંને માટે સુપર!',
  'પેપરની વાઇટનેસ અને ફિનિશિંગ બંને જોરદાર છે. ભાવ પણ એકદમ વ્યાજબી.',
  'ઓફિસ કામ માટે 5 રીમ મંગાવી હતી, સમયસર સુરક્ષિત પેકિંગ સાથે મળી ગઈ.',
  'બોથ-સાઈડ ઝેરોક્ષમાં જરાય અટકતું નથી અને બંને બાજુ ક્લિયર પ્રિન્ટ પડે છે.',
  'ઓરિજિનલ JK/કોપિયર પેપર છે. થરાદ બજાર કરતાં સારો ભાવ મળ્યો.',
  'પ્રિન્ટર ડ્રમમાં ધૂળ નથી જતી એટલો ક્લીન કટ પેપર છે. 100% Recommended!'
];

const FILE_OFFICE_COMMENTS = [
  'પ્લાસ્ટિક અને ક્લિપની ક્વોલિટી બહુ મજબૂત છે, સરકારી દસ્તાવેજો સાચવવા ઉત્તમ.',
  'ઓફિસ અને કોર્ટના અગત્યના કાગળો માટે એક નંબર ફાઇલ છે. લાંબો સમય ટકે છે.',
  'ચેઇન અને બટન ટકાઉ છે. હોલસેલ ભાવમાં આખો સેટ મળી ગયો.',
  'ડોક્યુમેન્ટ સુરક્ષિત રહે છે અને ફોલ્ડરમાં પાના બગડતા નથી. ગુણવત્તા જોરદાર છે.',
  'સ્કૂલ-કોલેજના પ્રોજેક્ટ અને સર્ટિફિકેટ માટે શ્રેષ્ઠ ફાઇલ.'
];

const SERVICE_COMMENTS = [
  'આધાર-પાન અને ઓનલાઇન ફોર્મનું કામ ભરતભાઈએ ફક્ત 5 મિનિટમાં પૂરું કરી આપ્યું!',
  'પ્રિન્ટ અને કલર ઝેરોક્ષની ક્વોલિટી એકદમ ક્રિસ્ટલ ક્લિયર આવી છે. ઉત્તમ સર્વિસ!',
  'થરાદમાં સરકારી સેવાઓ અને ઓનલાઇન અરજી માટે સૌથી ભરોસાપાત્ર સેન્ટર.',
  'લેમિનેશન એકદમ કડક અને શાઇની થયું છે, ડોક્યુમેન્ટ વર્ષો સુધી ખરાબ નહિ થાય.',
  'કોઈપણ વધારાની ફી લીધા વગર સચોટ કામ કરી આપ્યું, ખૂબ ખૂબ આભાર ભરતભાઈ.',
  'પાસ્પોર્ટ સાઈઝ ફોટા તાત્કાલિક બનાવી આપ્યા અને કલર પ્રિન્ટ પણ સુપર આવી.'
];

const CRAFT_COLOR_COMMENTS = [
  'કલર એકદમ બ્રાઇટ અને વાઇબ્રન્ટ છે, બાળકોને ડ્રોઇંગ કરવામાં ખૂબ મજા આવી.',
  'સ્કેચ પેન અને કલર પેન્સિલ લાંબો સમય ચાલે છે. પેકિંગ પણ આકર્ષક હતું.',
  'ડ્રોઇંગ શીટ જાડી છે, વોટર કલરથી પાના ફાટતા નથી. સુપર ક્વોલિટી!',
  'બાળકોની સ્કૂલ પ્રોજેક્ટ અને આર્ટ વર્ક માટે બેસ્ટ સામાન.'
];

const GENERAL_COMMENTS = [
  'એકદમ ઓરિજિનલ અને સુપર ક્વોલિટી છે. ભાવ પણ આખી બજાર કરતાં વ્યાજબી છે!',
  'પ્રિષા સ્ટેશનરીની સર્વિસ બહુ ફાસ્ટ છે. થરાદમાં સૌથી વિશ્વાસપાત્ર દુકાન.',
  'હોલસેલ ભાવે સારો માલ મળે છે. દુકાનદારનો સ્વભાવ પણ બહુ માયાળુ છે.',
  'પેકિંગ ખૂબ મજબૂત આવ્યું અને ડિલિવરી પણ ઝડપી મળી ગઈ. સંતોષકારક ખરીદી.',
  'સ્કૂલ અને કોલેજના સામાન માટે બેસ્ટ ક્વોલિટી. 100% Recommended!',
  'ઓનલાઇન ઓર્ડર કર્યો અને દુકાને જઈને સીધો પેક માલ મળી ગયો. સમયની ઘણી બચત થઈ.',
  'દરેક વખતે અહીંથી જ સામાન લઉં છું, ક્યારેય ફરિયાદ આવી નથી. 5 સ્ટાર સેવા!'
];

// Simple deterministic hash function for generating unique reviews per product
function getProductHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const getProductDefaultReviews = (product: ProductItem): ProductReview[] => {
  const nameGu = product.nameGu || '';
  const nameEn = product.nameEn || '';
  const isBook = product.category === 'books' || nameGu.includes('નોટબુક') || nameGu.includes('ચોપડા') || nameGu.includes('રજિસ્ટર') || nameEn.toLowerCase().includes('notebook') || nameEn.toLowerCase().includes('book');
  const isPen = product.category === 'stationery' && (nameGu.includes('પેન') || nameGu.includes('જેલ') || nameGu.includes('બોલપેન') || nameEn.toLowerCase().includes('pen'));
  const isPaper = nameGu.includes('પેપર') || nameGu.includes('રીમ') || nameGu.includes('A4') || nameEn.toLowerCase().includes('paper') || nameEn.toLowerCase().includes('rim');
  const isService = product.isService || product.category === 'service' || product.category === 'printing' || nameGu.includes('ઝેરોક્ષ') || nameGu.includes('ઓનલાઇન') || nameGu.includes('આધાર') || nameGu.includes('લેમિનેશન');
  const isFile = nameGu.includes('ફાઇલ') || nameGu.includes('ફોલ્ડર') || nameGu.includes('સ્ટેપલર') || nameEn.toLowerCase().includes('file');
  const isArt = nameGu.includes('કલર') || nameGu.includes('ડ્રોઇંગ') || nameGu.includes('પેન્સિલ') || nameEn.toLowerCase().includes('color') || nameEn.toLowerCase().includes('craft');

  // Select primary pool
  let primaryPool = GENERAL_COMMENTS;
  if (isBook) primaryPool = NOTEBOOK_COMMENTS;
  else if (isPen) primaryPool = PEN_COMMENTS;
  else if (isPaper) primaryPool = PAPER_COMMENTS;
  else if (isService) primaryPool = SERVICE_COMMENTS;
  else if (isFile) primaryPool = FILE_OFFICE_COMMENTS;
  else if (isArt) primaryPool = CRAFT_COLOR_COMMENTS;

  const seed = getProductHash(`${product.id}_${nameGu}_${product.price}`);
  const reviewCount = 5 + (seed % 3); // 5 to 7 reviews per product

  const result: ProductReview[] = [];
  const usedUsernames = new Set<string>();

  for (let i = 0; i < reviewCount; i++) {
    // Pick unique username from pool
    let userIdx = (seed + i * 7 + (i % 2) * 3) % REVIEWER_HANDLES.length;
    let username = REVIEWER_HANDLES[userIdx];
    let attempts = 0;
    while (usedUsernames.has(username) && attempts < 10) {
      userIdx = (userIdx + 3) % REVIEWER_HANDLES.length;
      username = REVIEWER_HANDLES[userIdx];
      attempts++;
    }
    usedUsernames.add(username);

    // Pick unique date from pool
    const dateIdx = (seed + i * 4 + i * 2) % REVIEW_DATES.length;
    const date = REVIEW_DATES[dateIdx];

    // Pick distinct comment tailored to product
    let comment = '';
    if (i % 2 === 0 && primaryPool.length > 0) {
      const commentIdx = (seed + i * 2) % primaryPool.length;
      comment = primaryPool[commentIdx];
    } else {
      // Alternate with general praise or complementary comment
      const altPool = isService ? SERVICE_COMMENTS : GENERAL_COMMENTS;
      const commentIdx = (seed + i * 3) % altPool.length;
      comment = altPool[commentIdx];
    }

    // Rating: Mostly 5 stars, occasional 4 star
    const rating = (i === 3 && (seed % 2 === 0)) ? 4 : 5;

    result.push({
      id: `rev-${product.id}-${i + 1}`,
      name: username,
      rating,
      comment,
      date
    });
  }

  return result;
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  cartQuantity,
  relatedProducts,
  onSelectProduct,
  storeSettings,
  isAdminUnlocked
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const getFinalPrice = (p: ProductItem) => {
    if (!p || !storeSettings) return p?.price || 0;
    const itemDiscount = p.discountPercent || 0;
    const catDiscount = storeSettings.categoryDiscounts?.[p.category] || 0;
    const globDiscount = storeSettings.globalDiscount || 0;
    const totalDiscount = Math.max(itemDiscount, catDiscount, globDiscount);
    if (totalDiscount > 0) return Math.round(p.price * (1 - totalDiscount / 100));
    return p.price;
  };

  // Reviews state: loads custom user-submitted reviews on top of dynamic, product-specific default reviews
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    if (!product) return [];
    let customUserReviews: ProductReview[] = [];
    try {
      const savedUser = localStorage.getItem(`prisha_user_reviews_${product.id}`);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (Array.isArray(parsed)) {
          customUserReviews = parsed;
        }
      }
    } catch {}
    
    const defaults = getProductDefaultReviews(product);
    return [...customUserReviews, ...defaults];
  });

  const [newReviewerName, setNewReviewerName] = useState('');
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Sync reviews and reset form/carousel when product changes
  useEffect(() => {
    if (!product) return;
    let customUserReviews: ProductReview[] = [];
    try {
      const savedUser = localStorage.getItem(`prisha_user_reviews_${product.id}`);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (Array.isArray(parsed)) {
          customUserReviews = parsed;
        }
      }
    } catch {}
    const defaults = getProductDefaultReviews(product);
    setReviews([...customUserReviews, ...defaults]);
    setActiveImageIndex(0);
    setShowReviewForm(false);
    setNewReviewerName('');
    setNewComment('');
  }, [product?.id]);

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
      id: `rev-user-${Date.now()}`,
      name: newReviewerName.trim(),
      rating: newRating,
      comment: newComment.trim(),
      date: dateFormatted
    };

    // Save custom user reviews separately
    try {
      let customUserReviews: ProductReview[] = [];
      const savedUser = localStorage.getItem(`prisha_user_reviews_${product.id}`);
      if (savedUser) {
        customUserReviews = JSON.parse(savedUser);
      }
      const updatedUser = [newRev, ...customUserReviews];
      localStorage.setItem(`prisha_user_reviews_${product.id}`, JSON.stringify(updatedUser));
    } catch {}

    setReviews(prev => [newRev, ...prev]);
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
                {(() => {
                  const currentPrice = getFinalPrice(product);
                  const originalPrice = product.mrp || (currentPrice < product.price ? product.price : 0);
                  const hasDiscount = originalPrice > currentPrice;
                  
                  return (
                    <>
                      <span className="text-2xl font-black text-orange-600 font-mono">
                        ₹{currentPrice}
                      </span>
                      <span className="text-xs font-bold text-neutral-500">
                        / {product.unit}
                      </span>
                      {hasDiscount && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-xs text-neutral-400 line-through font-bold">
                            MRP: ₹{originalPrice}
                          </span>
                          <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                            {product.discountPercent || Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
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

            {isAdminUnlocked && product.bulkPricing && (
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
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                  <div
                    key={rel.id}
                    onClick={() => onSelectProduct && onSelectProduct(rel)}
                    className="bg-neutral-50 rounded-xl p-2 border border-neutral-200 flex flex-col justify-between hover:border-orange-400 transition-colors cursor-pointer"
                  >
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
                      <span className="text-xs font-black text-orange-700">₹{getFinalPrice(rel)}</span>
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
