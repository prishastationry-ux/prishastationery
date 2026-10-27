import { ProductItem } from '../types';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface ItemReviewStats {
  rating: number;
  ratingFormatted: string;
  reviewCount: number;
  isPopular: boolean;
}

export function getItemReviewStats(item: ProductItem): ItemReviewStats {
  if (!item) {
    return {
      rating: 4.9,
      ratingFormatted: '4.9',
      reviewCount: 15,
      isPopular: false
    };
  }

  const nameGu = item.nameGu || '';
  const nameEn = (item.nameEn || '').toLowerCase();
  const badge = (item.badge || '').toLowerCase();

  const isBestsellerBadge =
    badge.includes('બેસ્ટ') ||
    badge.includes('best') ||
    badge.includes('હોટ') ||
    badge.includes('hot') ||
    badge.includes('લોકપ્રિય') ||
    badge.includes('ઓફર');

  const isPopularItem =
    isBestsellerBadge ||
    nameGu.includes('ક્લાસમેટ') ||
    nameGu.includes('નોટબુક') ||
    nameGu.includes('ચોપડા') ||
    nameGu.includes('બટરફ્લો') ||
    nameGu.includes('પેન') ||
    nameGu.includes('પેપર') ||
    nameGu.includes('A4') ||
    nameGu.includes('ઝેરોક્ષ') ||
    nameGu.includes('રજિસ્ટર') ||
    nameGu.includes('કેલ્ક્યુલેટર') ||
    nameEn.includes('classmate') ||
    nameEn.includes('butterflow') ||
    nameEn.includes('notebook') ||
    nameEn.includes('pen') ||
    nameEn.includes('paper');

  const seed = hashString(`${item.id}_${item.nameGu}_${item.price || 0}`);

  let reviewCount = 12;
  let rating = 4.8;

  if (isBestsellerBadge) {
    // Top bestsellers get between 42 and 68 reviews
    reviewCount = 42 + (seed % 27);
    rating = seed % 3 === 0 ? 5.0 : 4.9;
  } else if (isPopularItem) {
    // High demand stationery essentials get 24 to 45 reviews
    reviewCount = 24 + (seed % 22);
    rating = seed % 2 === 0 ? 4.9 : 4.8;
  } else if (item.price && item.price > 100) {
    // Mid items
    reviewCount = 14 + (seed % 16);
    rating = seed % 3 === 0 ? 4.9 : 4.8;
  } else {
    // Regular / standard items get 8 to 20 reviews
    reviewCount = 8 + (seed % 13);
    rating = seed % 4 === 0 ? 4.9 : 4.8;
  }

  return {
    rating,
    ratingFormatted: rating.toFixed(1),
    reviewCount,
    isPopular: isPopularItem || isBestsellerBadge
  };
}
