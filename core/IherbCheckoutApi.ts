import CartLineItems, { LineItem } from "./CartLineItems";
import {
  parseSubTotalLimit,
  generateIherbItemImage,
  convertPrice,
} from "../util/data";
import {
  IherbApiError,
  PROBE_VETOR_PRODUCT_NOT_QUALIFIED,
  ZIP_CODE_NOT_APPLIED,
} from "./error";

export interface IherbModifyItem {
  productId: number;
  quantity?: number;
  selected?: boolean;
}

// currently we just need theis info
export interface IherbItem {
  productId: number;
  quantityLimit: number;
  // the price after remove discount
  price: number;
  weight: number;
  image: string;
  name: string;
}

export interface CartInfo {
  subTotalLimit: number;
  freeShippingMinSpend: number;
}

export type MiningOrderItem = {
  quantity: number;
} & Omit<IherbItem, "quantityLimit">;

export interface MiningResult {
  total: number;
  tax: number;
  shipping: number;
  weight: number;
  shareOrderUrl: string;
  proceedToCheckout: boolean;
  miningOrderItems: MiningOrderItem[];
}

export interface ResponseIherbApi {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
}

export type CustomRequestMethod = (
  url: string,
  init: RequestInit
) => Promise<ResponseIherbApi>;

// if the request excute in content script it will auth, but in service workers it not work
// bacause service don't have the cookie, i can pass the cookie from injected to service
// but fetch (browser) do not allowed for programmatically use cookie

class IherbCheckoutApi {
  private baseUrl: string = "https://checkout9.iherb.com";
  private customRequestMethod: CustomRequestMethod | undefined = undefined;
  private onApiError: (target: IherbCheckoutApi, error: IherbApiError) => void =
    () => {};
  private onApiHealthy: (target: IherbCheckoutApi, isHealthy: boolean) => void =
    () => {};

  private async makeRequest(url: string, init: RequestInit): Promise<any> {
    try {
      let response: ResponseIherbApi;

      if (this.customRequestMethod) {
        response = await this.customRequestMethod(url, init);
      } else {
        response = (await fetch(url, init)) as any as ResponseIherbApi;
      }

      if (!response.ok) {
        this.onApiHealthy(this, false);
        // emit this error
        this.onApiError(
          this,
          new IherbApiError(`HTTP error: ${response.status}`, response.status)
        );
        // bad request
        if (response.status === 400) {
          console.log("Url", url);
          console.log("RequestInit", init);
        }

        throw new IherbApiError(
          `HTTP error: ${response.status}`,
          response.status
        );
      }

      // emit healty state
      this.onApiHealthy(this, true);

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  private createRequestInit(
    payload: object | null,
    method: "POST" | "PUT" | "DELETE" | "GET"
  ): object {
    const init = {
      headers: {
        // using cookie is not allowed :))
        // https://stackoverflow.com/questions/34558264/fetch-api-with-cookiee,
        "sec-Ch-Ua": '"Chromium";v="119", "Not?A_Brand";v="24"',
        "user-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.159 Safari/537.36",
        "Content-Type": "application/json",
        pref: '{"lac":"en-US","ctc":"VN","crc":"VND","crs":0,"storeid":0,"som":"kilograms"}',
        "sec-Ch-Ua-Platform": "Windows",
        accept: "*/*",
        "sec-Fetch-Site": "same-origin",
        "sec-Fetch-Mode": "cors",
        "sec-Fetch-Dest": "empty",
        "accept-Encoding": "gzip, deflate, br",
        "accept-Language": "en-US,en;q=0.9",
      },
      referrer: "https://checkout9.iherb.com/cart",
      referrerPolicy: "strict-origin-when-cross-origin",
      mode: "cors",
      // delete method don't have payload
      ...(!["DELETE", "GET"].some((m) => m === method) && {
        body: JSON.stringify(payload),
      }),
      method: method,
      credentials: "include",
    };

    return init;
  }

  public setOnApiError(
    listener: (target: IherbCheckoutApi, error: IherbApiError) => void
  ) {
    this.onApiError = listener;
  }

  public setOnApiHealthy(
    listener: (target: IherbCheckoutApi, isHealthy: boolean) => void
  ) {
    this.onApiHealthy = listener;
  }

  // use custom request method for content script
  public setCustomRequestMethod(requestMethod: CustomRequestMethod) {
    this.customRequestMethod = requestMethod;
  }

  // apply zip code to calculate shipping cost
  public async applyZipcode(
    zipCode: number,
    countryCode: string = "VN"
  ): Promise<boolean> {
    const url = `${this.baseUrl}/api/Carts/Comm/country/validateZipCode?countryCode=${countryCode}&zipCode=${zipCode}`;

    const init = this.createRequestInit(null, "GET");

    const res = await this.makeRequest(url, init);
    // response data look like this:
    // {
    //   "isValid": true,
    //   "errors": []
    // }
    if (res.isValid) return true;
    return false;
  }

  public async addLineItems(items: IherbModifyItem[]): Promise<CartLineItems> {
    const url = `${this.baseUrl}/api/Carts/v2/lineitems`;
    const payload = {
      resourceView: 2,
      lineItems: items,
    };
    const init = this.createRequestInit(payload, "POST");

    return this.makeRequest(url, init);
  }

  public async clearLineItems(): Promise<any> {
    const url = `${this.baseUrl}/api/Carts/v2/lineitems`;
    const init = this.createRequestInit(null, "DELETE");
    return this.makeRequest(url, init);
  }

  // get all important inform of orders in VN
  // the trick is create all over costs order to get
  // subtotal limit, free shipping threshold
  public async cartInfo(): Promise<CartInfo> {
    // clear cart first
    await this.clearLineItems();

    const res = (await this.addLineItems([
      {
        // NOW Foods, Ultra Omega-3, 500 EPA / 250 DHA, 180 Enteric Coated Softgels
        productId: 62118,
        quantity: 3,
      },
      {
        // NOW Foods, Double Strength L-Theanine, 200 mg, 120 Veg Capsules
        productId: 102333,
        quantity: 3,
      },
      {
        // Codeage, Liposomal Magnesium Glycinate, 240 Capsule
        productId: 115891,
        quantity: 1,
      },
    ])) as CartLineItems;

    if (!res.shippingMethods || res.shippingMethods?.length <= 0)
      throw new IherbApiError("Zip code wasn't applied", ZIP_CODE_NOT_APPLIED);

    const freeShippingMinSpend: number = parseFloat(
      res.shippingMethods[0].freeShippingLocalCurrencyThreshold
    );

    console.log("Get cart info result", res);

    if (res.cartErrors.length <= 0) {
      throw new IherbApiError(
        "The probe product vector is not yet qualified",
        PROBE_VETOR_PRODUCT_NOT_QUALIFIED
      );
    }

    // be carefull some time these

    const subTotalLimit: number = parseSubTotalLimit(
      res.cartErrors[0].errorMessage
    );

    return {
      freeShippingMinSpend,
      subTotalLimit,
    } as CartInfo;
  }

  // get details info of list of items like price, order limit ...
  public async mapItems(items: IherbModifyItem[]): Promise<IherbItem[]> {
    // clear old cart
    await this.clearLineItems();
    // create over quantity order base of current list items
    const overQuantityItems: IherbModifyItem[] = items.map((i) => {
      return {
        ...i,
        quantity: 9,
      } as IherbModifyItem;
    });

    console.log("overQuantityItems", overQuantityItems);

    const res = (await this.addLineItems(overQuantityItems)) as CartLineItems;

    const lineItems: LineItem[] = res.lineItems;

    const iherbItems: IherbItem[] = lineItems.map((i: LineItem) => {
      return {
        productId: i.productId,
        quantityLimit: i.quantity,
        price: convertPrice(i.price),
        weight: parseFloat(i.productInfo.weightKg),
        image: generateIherbItemImage(
          i.productInfo.partNumber,
          i.productInfo.product.primaryImageIndex
        ),
        name: i.productInfo.displayName,
      } as IherbItem;
    });

    return iherbItems;
  }

  public async mapOnceItem(item: IherbModifyItem): Promise<IherbItem> {
    const mapItems = await this.mapItems([item]);
    return mapItems[0];
  }

  // mining order to know is it free tax, free shipping for not
  public async miningOrder(
    items: IherbModifyItem[],
    clearOrder = false
  ): Promise<MiningResult> {
    // it case request in content script it will use user cookie
    // so we need clear old order first
    if (clearOrder) await this.clearLineItems();

    const cartLineItems = await this.addLineItems(items);

    const total: number = convertPrice(cartLineItems.cartTotal);
    const tax: number = convertPrice(cartLineItems.customsDutyTotal);
    const shipping: number = cartLineItems.shippingTotalDecimal;
    const weight: number = parseFloat(cartLineItems.weightTotalKg);
    const shareOrderUrl: string = cartLineItems.shareUrl;
    const proceedToCheckout: boolean = cartLineItems.proceedToCheckout;

    const miningOrderItems: MiningOrderItem[] = cartLineItems.lineItems.map(
      (item) => {
        return {
          productId: item.productId,
          name: item.productInfo.displayName,
          price: convertPrice(item.price),
          quantity: item.quantity,
          weight: parseFloat(item.productInfo.weightKg),
          image: generateIherbItemImage(
            item.productInfo.partNumber,
            item.productInfo.product.primaryImageIndex
          ),
        };
      }
    );

    return {
      total,
      tax,
      shipping,
      weight,
      shareOrderUrl,
      proceedToCheckout,
      miningOrderItems,
    };
  }
}

export default IherbCheckoutApi;
