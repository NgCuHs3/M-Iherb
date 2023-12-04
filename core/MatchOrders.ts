import IherbCheckoutApi, {
  CartInfo,
  IherbItem,
  IherbModifyItem,
  MiningResult,
} from "./IherbCheckoutApi";
import EventEmitter from "events";
import generateOptimizeOrders, {
  Order,
  ConstraintOrder,
  Product,
  LineItem,
  scoreOrders,
} from "./GenerateOptimizeOrders";

import { sleepWithCleaner, sleep } from "../util/timer";
import { IherbApiError, TAB_UNACTIVE_ERROR } from "./error";

export interface CleanableIntercept {
  cleanIntercept: Function;
}

export class ConditionDesire {
  private isFullfill: boolean = true;
  private cleanableIntercepts: CleanableIntercept[] = [];

  public addCleanIntercepts(cleanableIntercept: CleanableIntercept) {
    this.cleanableIntercepts.push(cleanableIntercept);
  }

  public showDesire() {
    // the request may be not execute soon because there may have block in loop thread
    for (const cleanableIntercept of this.cleanableIntercepts) {
      cleanableIntercept.cleanIntercept();
    }
    this.isFullfill = false;
  }

  public fullfill() {
    this.isFullfill = true;
  }

  public haveDesire(): boolean {
    return this.isFullfill;
  }

  public waitToFullfill(): Promise<void> {
    return new Promise(async (resolve) => {
      while (!this.isFullfill) {
        await sleep(300);
      }
      resolve();
    });
  }
}

type InfoLineItem = IherbItem & Product & LineItem;

type MatchOrder = Order<InfoLineItem>;

export // Iherb API will block request if have too many request so we need stop request for while if got block
class RequestPunisher implements CleanableIntercept {
  private numberOfViolations: number = 0;
  private sleepCleaner: Function = () => {};
  private resolveIntercept: Function = () => {};

  public cleanIntercept(): void {
    this.resolveIntercept();
    this.sleepCleaner();
  }

  public takeNoteViolation(): number {
    ++this.numberOfViolations;
    return this.numberOfViolations;
  }

  public wannaPunish(): boolean {
    return this.numberOfViolations > 0;
  }

  public punish(): Promise<number> {
    const deplay = Math.pow(2, this.numberOfViolations) * 1000;

    const { sleep: sleepClean, clean } = sleepWithCleaner(deplay);

    this.sleepCleaner = clean;

    return new Promise(async (resolve) => {
      this.resolveIntercept = () => resolve(-1);
      await sleepClean();
      resolve(deplay);
    });
  }

  public forgive() {
    this.numberOfViolations = 0;
  }
}

// to anticipate the Iherb API will block , we inscreae the time between the requests when it going reach reach the lime
export class RequestJudge implements CleanableIntercept {
  private numberOfActions: number = 0;
  // about 32 requests Iherb API will block request
  private maximumOfContinuousActions: number = 32;
  // 100 ms
  private probateTimeStep: number = 100;
  //
  private sleepCleaner: Function = () => {};
  private resolveIntercept: Function = () => {};

  public cleanIntercept() {
    this.resolveIntercept();
    this.sleepCleaner();
  }

  public forgive() {
    this.numberOfActions = 0;
  }

  public supervise(): number {
    ++this.numberOfActions;
    return this.numberOfActions;
  }

  public wannaProbate(): boolean {
    // wanna probate when over 50% of maximum number actions
    if (this.numberOfActions < Math.floor(this.maximumOfContinuousActions / 2))
      return false;

    return true;
  }

  public probate(): Promise<number> {
    // add 50ms deplay if numbers of actions over 50% of maximun actions (or request API allow)

    let deplay = 0;

    // case 1
    if (this.numberOfActions < this.maximumOfContinuousActions) {
      deplay =
        (this.numberOfActions -
          Math.floor(this.maximumOfContinuousActions / 2)) *
        50;
    }

    // case 2
    if (
      // over maximum condition
      this.numberOfActions >= this.maximumOfContinuousActions &&
      // under 50% of next cycle
      this.numberOfActions % this.maximumOfContinuousActions <
        Math.floor(this.maximumOfContinuousActions / 2)
    ) {
      const overMaximumCount =
        this.numberOfActions % this.maximumOfContinuousActions;

      const maximumDeplay =
        Math.floor(this.numberOfActions / 2) * this.probateTimeStep;

      deplay = Math.max(
        0,
        Math.floor(maximumDeplay / Math.pow(2, overMaximumCount))
      );
    }

    // case 3
    if (
      this.numberOfActions > this.maximumOfContinuousActions &&
      // over 50% of next cycle
      this.numberOfActions % this.maximumOfContinuousActions >
        Math.floor(this.maximumOfContinuousActions / 2)
    ) {
      const overMaximumCount =
        this.numberOfActions % this.maximumOfContinuousActions;
      const overSlowThreshold =
        overMaximumCount - Math.floor(this.maximumOfContinuousActions / 2);
      deplay = overSlowThreshold * this.probateTimeStep;
    }

    const { sleep: sleepClean, clean } = sleepWithCleaner(deplay);

    this.sleepCleaner = clean;

    return new Promise(async (resolve) => {
      this.resolveIntercept = () => resolve(-1);
      await sleepClean();
      resolve(deplay);
    });
  }
}

export interface WatchQueueFunction<T> {
  (queue: T[]): void;
}

// to track the change of the array
export class WatchUpQueue<T> {
  private queue: T[] = [];
  private watcher: WatchQueueFunction<T> = (q: T[]) => {};

  public count() {
    return this.queue.length;
  }

  public alternative(items: T[]) {
    this.queue = items;
    this.watcher(this.queue);
  }

  public merge(items: T[]) {
    this.queue = [...this.queue, ...items];
    this.watcher(this.queue);
  }

  public peek(): T[] {
    return this.queue;
  }

  public clear() {
    this.queue = [];
    this.watcher(this.queue);
  }

  public shift(): T {
    const item: T = this.queue.shift() as T;
    this.watcher(this.queue);
    return item;
  }

  public unshift(item: T) {
    this.queue.unshift(item);
    this.watcher(this.queue);
  }

  public setWatcher(watcher: WatchQueueFunction<T>) {
    this.watcher = watcher;
  }
}

class MatchOrders extends EventEmitter {
  private iherbCheckoutApi: IherbCheckoutApi;
  private isIdle: boolean = true;
  // if instance is enable it will run when have new event like add or remove item in
  // match list
  private isEnable: boolean = false;
  private requestToIdle: ConditionDesire;
  private matchList: IherbModifyItem[] = [];
  private submitOrders: WatchUpQueue<MatchOrder>;
  private constraintInfo: ConstraintOrder | undefined;
  // allow underShipping 100k
  private underFreeShipTolerance: number = 50000;
  private maximumShippingAllowed: number = 100000;
  private subtotalLimitBottomPadding: number = 60000;
  private maximumWeightTotal: number = 0.5;
  // success mining order
  private successMiningList: MiningResult[] = [];
  // match task thread
  private matchTask: Promise<boolean> | undefined;
  private networkPunisher: RequestPunisher;
  private networkJudge: RequestJudge;

  constructor(iherbCheckoutApi: IherbCheckoutApi) {
    super();
    this.submitOrders = new WatchUpQueue<MatchOrder>();
    this.submitOrders.setWatcher(this.onNumberOfJobsChange);
    this.networkPunisher = new RequestPunisher();
    this.networkJudge = new RequestJudge();
    this.requestToIdle = new ConditionDesire();
    this.requestToIdle.addCleanIntercepts(this.networkPunisher);
    this.requestToIdle.addCleanIntercepts(this.networkJudge);
    this.iherbCheckoutApi = iherbCheckoutApi;
  }

  public async init(): Promise<boolean> {
    await this.getConstraintInfo();
    return true;
  }

  private onNumberOfJobsChange(submitOrders: MatchOrder[]) {
    this.emit("update-number-jobs", this, this.submitOrders.count());
  }

  private async getConstraintInfo() {
    const cartInfo: CartInfo = await this.iherbCheckoutApi.cartInfo();
    this.constraintInfo = {
      subtotalLimit: cartInfo.subTotalLimit,
      freeShipMinSp: cartInfo.freeShippingMinSpend,
      underFreeShipTolerance: this.underFreeShipTolerance,
      subtotalLimitBottomPadding: this.subtotalLimitBottomPadding,
      maximumWeightTotal: this.maximumWeightTotal,
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
      while (this.submitOrders.count() > 0) {
        console.log("Start match loop", this.submitOrders);
        console.log("requestToIdle", this.requestToIdle);

        // have force stop
        if (!this.requestToIdle.haveDesire()) {
          this.requestToIdle.fullfill();
          break;
        }

        if (this.networkPunisher.wannaPunish()) {
          // so we punish
          const punishedTime = await this.networkPunisher.punish();
          // after punish we forgive for the judge
          this.networkJudge.forgive();
          console.log("punishedTime", punishedTime);
        }

        if (this.networkJudge.wannaProbate()) {
          const probateTime = await this.networkJudge.probate();
          console.log("probateTime", probateTime);
        }

        // default slow request 200ms
        // await sleep(200);

        const submitOrder = this.submitOrders.shift();
        let miningResult: MiningResult;
        try {
          // increase the request actions to judge
          const numberOfSuperviseActions = this.networkJudge.supervise();
          console.log("numberOfSuperviseActions", numberOfSuperviseActions);
          // the request can be error
          // just post need fields
          miningResult = await this.iherbCheckoutApi.miningOrder(
            submitOrder?.lineItems.map((lineItem) => {
              return {
                productId: lineItem.productId,
                quantity: lineItem.quantity,
              };
            }) as LineItem[],
            // clear cart before add new order
            true
          );
          // success request so we forgive it
          this.networkPunisher.forgive();
        } catch (error) {
          if (
            error instanceof IherbApiError &&
            error.code === TAB_UNACTIVE_ERROR
          ) {
            console.log("tab not active so try later !");
            // just wait 3000s and try again
            // unshift the mining order
            this.submitOrders.unshift(submitOrder as MatchOrder);
            await sleep(3000);
            continue;
          }
          // take note the violation
          this.networkPunisher.takeNoteViolation();
          // unshift the mining order
          this.submitOrders.unshift(submitOrder as MatchOrder);
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
        this.emit("found-good-order", this, miningResult);
      }

      // change to idle state
      this.isIdle = true;

      if (this.requestToIdle.haveDesire()) this.requestToIdle.fullfill();

      resolve();
    };

    // start new thread (i use thread for async, it not mean thread :)))
    this.matchTask = new Promise(task);
  }

  private clearMatchData() {
    this.matchList = [];
    this.submitOrders.clear();
    this.successMiningList = [];
  }

  private async generateSubmitList(
    iherbModifyItems: IherbModifyItem[]
  ): Promise<MatchOrder[]> {
    // populate infomation for modify item like price, quantity, imit
    const iherbItems: IherbItem[] = await this.iherbCheckoutApi.mapItems(
      iherbModifyItems
    );

    if (!this.constraintInfo) throw new Error("ContraintInfo");
    // generates the submit orders (optimize orders)
    const considerOrders: MatchOrder[] = generateOptimizeOrders<
      Product,
      InfoLineItem
    >(iherbItems as Product[], this.constraintInfo);

    return considerOrders;
  }

  public async start(initItems: IherbModifyItem[]) {
    // can't start while it is matching
    if (!this.isIdle) return;

    this.isEnable = true;
    this.matchList = initItems;

    console.log("matchList for create submit list", this.matchList);

    const submitList = await this.generateSubmitList(this.matchList);

    this.submitOrders.alternative(submitList);

    console.log("submitOrders", JSON.stringify(this.submitOrders));
    // start match orders
    this.matchOrders();
  }

  public async stop() {
    this.isEnable = false;

    console.log("Begin stop matchs orders, idle: ", this.isIdle);
    // it is idle just clear the
    if (!this.isIdle) {
      this.requestToIdle.showDesire();
      // wait until idle
      await this.requestToIdle.waitToFullfill();
      //
      console.log("Request to idle success !");
    }

    // now clear evenything
    this.clearMatchData();
  }

  public async addMatchItem(iherbModifyItem: IherbModifyItem) {
    const existingProduct = this.matchList.find(
      (i) => i.productId === iherbModifyItem.productId
    );
    // this product already have in the match list
    if (existingProduct) return false;
    // add to match list
    this.matchList.push(iherbModifyItem);

    // create new consider orders
    const considerOrders: MatchOrder[] = await this.generateSubmitList(
      this.matchList
    );
    // just keep the orders that have this new item in
    const shortOrders: MatchOrder[] = considerOrders.filter((order) => {
      const isHaveNewitem = order.lineItems.some(
        (lineItem) => lineItem.productId === iherbModifyItem.productId
      );
      return isHaveNewitem;
    });
    // push to submits list
    this.submitOrders.merge(shortOrders);
    // re score all submit orders to make sure that there no good order under bad order
    const reScoreMatchOrders = scoreOrders<InfoLineItem>(
      this.submitOrders.peek(),
      this.constraintInfo?.freeShipMinSp as number
    );

    this.submitOrders.alternative(reScoreMatchOrders);
    console.log(
      "Update submit orders after add item and re score",
      this.submitOrders
    );
    // instance is ready but idle so we trigger it
    if (this.isEnable && this.isIdle) {
      console.log("Rematch orders");
      this.matchOrders();
    }

    return true;
  }

  public removeMatchItem(iherbModifyItem: IherbModifyItem) {
    const existingProduct = this.matchList.find(
      (i) => i.productId === iherbModifyItem.productId
    );
    // the item not already in list
    if (!existingProduct) return false;

    // remove out of list
    this.matchList = this.matchList.filter(
      (x) => x.productId !== iherbModifyItem.productId
    );

    console.log("submitOrders before remove items", this.submitOrders);
    // remove submit order that have current items
    const trimSubmitOders = this.submitOrders.peek().filter((order) => {
      const isHaveRemoveItem = order.lineItems.some(
        (item) => item.productId === iherbModifyItem.productId
      );
      return !isHaveRemoveItem;
    });

    this.submitOrders.alternative(trimSubmitOders);

    console.log("submitOrders after remove items", this.submitOrders);

    // hmm!!! this case whill never happen because if idle the submit orders list empty
    if (this.isEnable && this.isIdle) {
      this.matchOrders();
    }
    return true;
  }

  public async clearMatchItems() {
    console.log("clear all match list-> clear all submit order");
    this.clearMatchData();
  }
}

export default MatchOrders;
