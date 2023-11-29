import IherbCheckoutApi, {
  CartInfo,
  IherbModifyItem,
  MiningResult,
} from "./IherbCheckoutApi";
import EventEmitter from "events";
import generateOptimizeOrders, {
  Order,
  ConstraintOrder,
  Product,
} from "./GenerateOptimizeOrders";

import { sleep } from "../util/timer";

class MatchOrders extends EventEmitter {
  private iherbCheckoutApi: IherbCheckoutApi;
  private isIdle: boolean = true;
  // if instance is enable it will run when have new event like add or remove item in
  // match list
  private isEnable: boolean = false;
  private requestToIdle: boolean = false;
  private matchList: IherbModifyItem[] = [];
  private submitOrders: Order[] = [];
  // private successMiningOrderList:
  private constraintInfo: ConstraintOrder | undefined;
  // allow underShipping 100k
  private underFreeShipTolerance: number = 100000;
  private maximumShippingAllowed: number = 100000;
  // success mining order
  private successMiningList: MiningResult[] = [];
  // match task thread
  private matchTask: Promise<boolean> | undefined;

  constructor() {
    super();
    this.iherbCheckoutApi = new IherbCheckoutApi();
  }

  public async init() {
    this.getConstraintInfo();
  }

  private async getConstraintInfo() {
    const cartInfo: CartInfo = await this.iherbCheckoutApi.cartInfo();
    this.constraintInfo = {
      subtotalLimit: cartInfo.subTotalLimit,
      freeShipMinSp: cartInfo.freeShippingMinSpend,
      underFreeShipTolerance: this.underFreeShipTolerance,
    };
  }

  private async matchOrders() {
    // we will fetch each by each orders to get free tax, and shiping order
    // an order consider success mining í comply with theis conditions
    // 1. tax free
    // 2. shipping less than 100k
    // 3. able to to proceed to checkout (it mean the order can checkout)

    // init task state
    this.isIdle = false;

    const task = async (resolve: Function) => {
      while (this.submitOrders.length > 0) {
        // have force stop
        if (this.requestToIdle) {
          this.requestToIdle = true;
          break;
        }

        const submitOrder = this.submitOrders.shift();
        let miningResult: MiningResult;
        try {
          // the request can be error
          miningResult = await this.iherbCheckoutApi.miningOrder(
            submitOrder?.lineItems as IherbModifyItem[]
          );
        } catch {
          continue;
        }

        if (
          miningResult.tax !== 0 ||
          miningResult.shipping >= this.maximumShippingAllowed ||
          !miningResult.proceedToCheckout
        )
          continue;
        // found perfect order
        this.successMiningList.push(miningResult);
        // emit to observers
        this.emit("found-good-order", this.successMiningList, miningResult);
      }

      // change to idle state
      this.isIdle = true;
      this.requestToIdle = true;
      resolve(true);
    };

    // start new thread (i use thread for async, it not mean thread :)))
    this.matchTask = new Promise(task);
  }

  private clearMatchData() {
    this.matchList = [];
    this.submitOrders = [];
    this.successMiningList = [];
  }

  private async generateSubmitList(
    iherbModifyItems: IherbModifyItem[]
  ): Promise<Order[]> {
    // populate infomation for modify item like price, quantity, imit
    const iherbItems = await this.iherbCheckoutApi.mapItems(iherbModifyItems);

    if (!this.constraintInfo) throw new Error("ContraintInfo");
    // generates the submit orders (optimize orders)
    const considerOrders: Order[] = generateOptimizeOrders(
      iherbItems as Product[],
      this.constraintInfo
    );
    return considerOrders;
  }

  public async start(initItems: IherbModifyItem[]) {
    // can't start while it is matching
    if (!this.isIdle) return;

    this.isEnable = true;
    this.matchList = initItems;
    this.submitOrders = await this.generateSubmitList(this.matchList);
    // start match orders
    this.matchOrders();
  }

  public async stop() {
    this.isEnable = false;

    // it is idle just clear the
    if (this.isIdle) {
      this.clearMatchData();
      return;
    }

    this.requestToIdle = true;

    // wait until request got acept
    while (true) {
      await sleep(1000);
      // there may be some case that in case in the least loop idle
      // will not change state
      if (this.requestToIdle) break;
    }

    // now clear evenything
    this.clearMatchData();
  }

  public async addMatchItem(iherbModifyItem: IherbModifyItem) {
    // only allow add when instance is ready
    if (!this.isEnable) return false;

    const existingProduct = this.matchList.find(
      (i) => i.productId === iherbModifyItem.productId
    );
    // this product already have in the match list
    if (existingProduct) return false;
    // add to match list
    this.matchList.push(iherbModifyItem);

    // create new consider orders
    const considerOrders: Order[] = await this.generateSubmitList(
      this.matchList
    );
    // just keep the orders that have this new item in
    const shortOrders: Order[] = considerOrders.filter((order) => {
      const isHaveNewitem = order.lineItems.some(
        (lineItem) => lineItem.productId === iherbModifyItem.productId
      );
      return isHaveNewitem;
    });
    // push to submits list
    this.submitOrders = [...this.submitOrders, ...shortOrders];

    // instance is ready but idle so we trigger it
    if (this.isEnable && this.isIdle) {
      this.matchOrders();
    }

    return true;
  }

  public async removeMatchItem(iherbModifyItem: IherbModifyItem) {
    // only allow when instance is ready
    if (!this.isEnable) return false;

    const existingProduct = this.matchList.find(
      (i) => i.productId === iherbModifyItem.productId
    );
    // the item not already in list
    if (!existingProduct) return false;

    // remove out of list
    this.matchList = this.matchList.filter(
      (x) => x.productId !== iherbModifyItem.productId
    );

    // remove submit order that have current items
    this.submitOrders = this.submitOrders.filter((order) => {
      const isHaveRemoveItem = order.lineItems.some(
        (item) => item.productId === iherbModifyItem.productId
      );
      return !isHaveRemoveItem;
    });

    // hmm!!! this case whill never happen because if idle the submit orders list empty
    if (this.isEnable && this.isIdle) {
      this.matchOrders();
    }
    return true;
  }
}

export default MatchOrders;
