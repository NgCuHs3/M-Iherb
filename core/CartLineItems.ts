export interface Product {
  noAir: boolean;
  restrictedInCA: boolean | null;
  prop65Message: string | null;
  showPrice: boolean;
  material: number;
  status: number;
  primaryImageIndex: number;
  listPrice: number;
  retailPrice: number;
  sac: number;
  actualWeight: number;
  height: number;
  length: number;
  dimensionalWeight: number;
  shippingWeight: number;
  width: number;
  productId: number;
  brandCode: string;
  brandName: string;
  displayName: string;
  iced: string;
  languageCode: string;
  partNumber: string;
  salesTaxCode: string;
  urlName: string;
  averageRating: number;
  reviewCount: number;
  id: number;
}

export interface ProductInfo {
  product: Product;
  partNumber: string;
  productUrl: string;
  weight: string;
  weightKg: string;
  brandName: string;
  displayName: string;
}

export interface LineItemError {
  errorType: number;
  errorSource: number;
  errorCode: number;
  errorMessage: string;
  isInUnavailableGroup: boolean;
  subErrorCode: number;
}

export interface LineItemDiscount {
  amount: number;
  amountInUSD: string;
  formattedAmount: string;
  discountMessage: string | null;
  discountDisplayType: string;
  discountValueType: number;
  discountType: number;
  discountLevel: number;
  discountValue: number;
  promoEndDate: string | null;
  timeLeftForPromo: string | null;
  endDateUnixTimeStamp: string | null;
  subscriptionDiscountDescription: string | null;
  specialEndingMessage: string | null;
}

export interface LineItem {
  status: number;
  productId: number;
  quantity: number;
  listPrice: string;
  price: string;
  surcharge: string;
  productInfo: ProductInfo;
  lineItemErrors: LineItemError[];
  lineItemDiscount: LineItemDiscount[];
  total: string;
  totalInUSD: string;
  adjustedTotal: string;
  adjustedTotalInUSD: string;
  eligibleForDiscount: boolean;
  isHazardOrIced: boolean;
  showPrice: boolean;
  currentStore: number;
  type1Activated: boolean;
  eligibleSimpleDiscountType: any; // Replace 'any' with a more specific type if possible
  storeId: number;
  warningMessages: any[]; // Replace 'any' with a more specific type if possible
  maxAvailableQuantity: number;
  selected: boolean;
  selectorDisabled: boolean;
  subscribable: boolean;
  frequencyId: any; // Replace 'any' with a more specific type if possible
  frequencyText: any; // Replace 'any' with a more specific type if possible
  subscriptionId: any; // Replace 'any' with a more specific type if possible
  isLimitProductQty: boolean;
  isInUnavailableGroup: boolean;
  subscriptionText: any; // Replace 'any' with a more specific type if possible
  subscriptionCaption: any; // Replace 'any' with a more specific type if possible
  subscriptionTooltip: any; // Replace 'any' with a more specific type if possible
  isAvailable: boolean;
  isDiscontinued: boolean;
  isOutOfStock: boolean;
  isRestricted: boolean;
  stockQty: number;
  nextDeliveryDate: any; // Replace 'any' with a more specific type if possible
  skipNextDelivery: boolean;
  isOneTime: boolean;
}

export interface ShippingMethod {
  isAvailable: boolean;
  isCanadaDDP: boolean;
  isChinaDDP: boolean;
  isDomestic: boolean;
  isDDU: boolean;
  isFree: boolean;
  totallyFree: boolean;
  isSelected: boolean;
  showCustoms: boolean;
  showPrice: boolean;
  weightOverage: number;
  weightOverageKg: number;
  errors: string[];
  serviceId: number;
  actualServiceId: number;
  actualServiceName: string;
  serviceNotAvailableReason: number;
  adjustedCost: string;
  customsDutyTotal: string;
  description: string;
  duties: string;
  logoFullyQualifiedUrl: string;
  logoURL: string;
  orderDeliveryRange: string;
  fromDate: string;
  toDate: string;
  fromDatePst: string;
  toDatePst: string;
  serviceDisplayName: string;
  serviceName: string;
  shippingTotal: string;
  subtotalOverage: string;
  vat: string;
  originalShippingTotal: any; // You may need to define a specific type for this property
  finalCost: string;
  shippingFreeDisplayName: any; // You may need to define a specific type for this property
  unavailNotes: {
    reasons: string[];
    message: string;
  };
  specialNote: any; // You may need to define a specific type for this property
  shippingCost: {
    label: string;
    content: string;
    isTaxCollectedOnDelivery: boolean;
  };
  shippingDutyAndTax: {
    label: string;
    content: string;
    isTaxCollectedOnDelivery: boolean;
  };
  freeShippingGap: any; // You may need to define a specific type for this property
  freeShippingThreshold: string;
  freeShippingLocalCurrencyThreshold: string;
  hideServiceLogo: boolean;
  dutyAndTaxFlag: number;
  isClimateControl: boolean;
  availableStatus: number;
}

export interface DutyAndTax {
  dutiesAndTaxes: {
    label: string;
    content: string;
    helpTitle: string;
    helpContent: string;
    isTaxCollectedOnDelivery: boolean;
  };
}

export interface DiscountWarningMessage {
  warningMsgType: number;
  warningMsg: string;
  warningPopupTitle: string;
  warningPopupMsg: string;
  messageLevel: number;
  displayCode: any; // You may need to define a specific type for this property
  discountType: number;
}

export interface OrderDiscount {
  couponCode: string;
  discountText: string;
  discountMessage: string;
  appliedToProductsCount: number;
  appliedToProducts: string;
  displayRemoveDiscountButton: boolean;
  validApplied: boolean;
  notApplicable: boolean;
  isPaymentCode: boolean;
  warningMessage: DiscountWarningMessage;
  discountMessageToolTip: {
    reasonType: number;
    title: string;
    contents: {
      text: string;
    }[];
  };
}

export interface DutiesAndTaxes {
  label: string;
  content: string;
  helpTitle: string;
  helpContent: string;
  isTaxCollectedOnDelivery: boolean;
}

export interface WarningMessage {
  warningMsgType: number;
  warningMsg: string;
  messageLevel: number;
  displayCode: any; // You may need to define a specific type for this property
  discountType: number;
}

export interface CartDiscount {
  amount: number;
  formattedAmount: string;
  discountMessage: string;
  discountDisplayType: string | null;
  discountValueType: number;
  discountType: number;
  discountLevel: number;
  discountValue: number;
  promoEndDate: string;
  timeLeftForPromo: string;
  endDateUnixTimeStamp: string;
  additionalData: string;
  isFirstTimeCustomer: boolean;
  orderDiscountDistributeProductDict: Record<
    string,
    { discountAmount: number; availableQuantity: number }
  >;
  warningMessage: {
    warningMsgType: number;
    warningMsg: string;
    messageLevel: number;
    displayCode: string | null;
    discountType: number;
  };
  eligibleMessage: string | null;
  appliedToProductsCount: number;
}

export interface CartError {
  errorType: number;
  errorSource: number;
  errorCode: number;
  errorMessage: string;
  isInUnavailableGroup: boolean;
  subErrorCode: number;
}

export default interface CartLineItems {
  isCanadaDDP: boolean;
  isChinaDDP: boolean;
  isDDU: boolean;
  isZipCodeNeeded: boolean;
  proceedToCheckout: boolean;
  unifiedPricing: boolean;
  currentStore: number;
  country: {
    countryCode: string;
    languageCode: string;
    displayName: string;
  };
  cartId: string;
  orderDisclaimers: any[]; // You might want to replace 'any' with a specific type if possible
  cartQuantity: number;
  selectedQuantity: number;
  cartTotal: string;
  currencyCode: string;
  duties: string;
  vat: string;
  customsDutyTotal: string;
  languageCode: string;
  shippingMessage: string | null;
  shippingTotal: string;
  shippingServiceId: number;
  taxTotal: string;
  taxTotalForMobile: string;
  taxLabel: string;
  dutyAndTaxLabel: string;
  showSalesTaxInfo: boolean;
  prepaidShippingTotal: number;
  prepaidShippingTotalFormatted: string;
  invalidReferalCodeMessage: string | null;
  invalidPromoCodeMessage: string | null;
  isEuIossCountry: boolean;
  toastType: number;
  cartDiscount: CartDiscount[];
  cartErrors: CartError[];
  lineItems: LineItem[];
  shippingMethods: ShippingMethod[];
  adjustedSubTotal: string;
  referralCode: string;
  appliedCouponCodeType: number;
  appliedCouponCodeStatus: number;
  referralCodeCreateSpan: number;
  referralCodeCreateTimestamp: number;
  rewardCreditApplied: string;
  rewardCreditAppliedInUSD: number;
  storeCreditApplied: string;
  shareUrl: string;
  subTotal: string;
  totalDiscount: string;
  totalProductDiscount: string;
  weightTotal: string;
  weightTotalKg: string;
  specialNote: string;
  disableAllSubscriptions: boolean;
  productDiscountsTotal: string;
  manualPromoDiscountsTotal: string;
  rewardsDiscountsTotal: string;
  shippingCreditDisplayName: string | null;
  postalCode: string;
  selfRewardsCode: string;
  showGLPopupMsg: boolean;
  dutyAndTax: DutyAndTax;
  shippingTotalDecimal: number;
  subscribable: boolean;
  cluster: string;
  subscriptionCaption: string | null;
  subscriptionTooltip: string | null;
  orderDiscount: OrderDiscount;
  freeShippingRatio: number;
  freeShippingGap: string;
  isCarrierAutoChanged: boolean;
  carrierChangedReason: string | null;
  skipDeliveryEnabled: boolean;
  autoPromoCode: any; // You might want to replace 'any' with a specific type if possible
  totalSavedAndDeductionAmount: string;
}
