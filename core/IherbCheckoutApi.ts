import CartLineItems, { LineItem } from "./CartLineItems";
import {
  parseSubTotalLimit,
  generateIherbItemImage,
  convertPrice,
} from "../util/data";

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
} & Omit<IherbModifyItem, "quantityLimit">;

export interface MiningResult {
  total: number;
  tax: number;
  shipping: number;
  weight: number;
  shareOrderUrl: String;
  proceedToCheckout: boolean;
  miningOrder: MiningOrderItem[];
}

export interface ResponseIherbApi {
  ok: boolean;
  status: number;
  json: () => any;
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

  private async makeRequest(url: string, init: RequestInit): Promise<any> {
    try {
      let response: ResponseIherbApi;

      if (this.customRequestMethod) {
        response = await this.customRequestMethod(url, init);
      } else {
        response = (await fetch(url, init)) as any as ResponseIherbApi;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = response.json();
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
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
    let res = (await this.addLineItems([
      {
        // NOW Foods, Ultra Omega-3, 500 EPA / 250 DHA, 180 Enteric Coated Softgels
        productId: 8341,
        quantity: 3,
      },
      {
        // NOW Foods, Double Strength L-Theanine, 200 mg, 120 Veg Capsules
        productId: 54096,
        quantity: 3,
      },
    ])) as CartLineItems;

    if (!res.shippingMethods || res.shippingMethods?.length <= 0) {
      // throw new Error("Zip code wasn't applied");
      // try apply zip code
      await this.applyZipcode(71300);
    }

    // try again
    res = (await this.addLineItems([
      {
        // NOW Foods, Ultra Omega-3, 500 EPA / 250 DHA, 180 Enteric Coated Softgels
        productId: 8341,
        quantity: 3,
      },
      {
        // NOW Foods, Double Strength L-Theanine, 200 mg, 120 Veg Capsules
        productId: 54096,
        quantity: 3,
      },
    ])) as CartLineItems;

    const freeShippingMinSpend: number = parseFloat(
      res.shippingMethods[0].freeShippingLocalCurrencyThreshold
    );

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

    const miningOrder: MiningOrderItem[] = cartLineItems.lineItems.map(
      (item) => {
        return {
          productId: item.productId,
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
      miningOrder,
    };
  }
}

export default IherbCheckoutApi;
