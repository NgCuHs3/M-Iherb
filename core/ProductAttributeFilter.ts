export type PriceRange = "1" | "2" | "3" | "4" | "5";

export default interface ProductAttributeFilter {
  attributeValueIds: string[];
  brandCodes: string[];
  categoryIds: string[];
  healthTopicIds: string[];
  includeDiscontinued: boolean;
  includeOutOfStock: boolean;
  priceRanges: PriceRange[];
  programs: string[];
  ratings: string[];
  searchWithinKeyWord: string;
  showITested: boolean;
  showShippingSaver: boolean;
  sort: null | string; // Assuming sort can be null or a string
  specials: string;
  weights: string[];
}
