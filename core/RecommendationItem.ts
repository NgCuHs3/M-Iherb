export default interface RecommendationItem {
  autoApplyDiscountPercentage: null | number;
  brandCode: string;
  brandName: string;
  currencySymbol: null | string;
  discountType: number;
  discountedPrice: string;
  discountedPriceAmount: number;
  formattedPartNumber: null | string;
  hidePrice: boolean;
  id: number;
  isCurrencySymbolOnLeft: null | boolean;
  isInCartDiscount: boolean;
  isInGroup: boolean;
  listPrice: string;
  listPriceAmount: number;
  name: string;
  partNumber: string;
  primaryImageIndex: number;
  productFlag: null | string;
  rating: number;
  ratingCount: number;
  ratingStarsMap: number[];
  ratingUrl: string;
  reviewUrl: string;
  salesDiscountPercentage: number;
  specialDealInfo: null | string;
  url: string;
}
