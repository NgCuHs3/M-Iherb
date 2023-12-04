import IherbCheckoutApi, {
  CartInfo,
  IherbItem,
  IherbModifyItem,
  MiningResult,
  ResponseIherbApi,
} from "./core/IherbCheckoutApi";
import MatchOrders from "./core/MatchOrders";
import { IherbApiError, TAB_UNACTIVE_ERROR } from "./core/error";
import { generateHashForOrder } from "./util/data";

export type MatchItem = Omit<IherbModifyItem, "quantity" | "selected"> & {
  name: string;
  image: string;
  price: number;
  weight: number;
};

export type GoodOrder = MiningResult & {
  id: string;
};

// export type UserSettings = {
//   autoMatchEnable: boolean;
//   subtotalLimitBottomPadding: boolean;
//   underFreeShipTolerance: number;
//   maximumShippingAllowed: number;
//   maximumWeightTotal: number;
// };

export type ExtensionState = {
  isReady: boolean;
  error:
    | {
        code: number;
        message: string;
      }
    | undefined;
};

type ServiceInstance = {
  iherbCheckoutApi: IherbCheckoutApi | undefined;
  matchOrders: MatchOrders | undefined;
  tabId: number | undefined;
  cartInfo: CartInfo | undefined;
  extensionState: ExtensionState | undefined;
};

const serviceInstance: ServiceInstance = {
  matchOrders: undefined,
  iherbCheckoutApi: undefined,
  tabId: undefined,
  cartInfo: undefined,
  extensionState: undefined,
};

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

async function initExtensionState(): Promise<ExtensionState> {
  // try to get cart info like a way to check app ready or not
  try {
    serviceInstance.cartInfo = await getCartInfo();
  } catch (error) {
    if (!(error instanceof IherbApiError)) {
      console.error(error);
      new Error("Unkonw error while check app ready");
    }
    return {
      isReady: false,
      error: {
        message: (error as IherbApiError).message,
        code: (error as IherbApiError).code,
      },
    };
  }
  return {
    isReady: true,
    error: undefined,
  };
}

async function onFoundGoodOrder(
  target: MatchOrders,
  miningResult: MiningResult
) {
  const data = await chrome.storage.local.get(["good-order-list"]);
  const goodOrderList: Array<GoodOrder> =
    (data["good-order-list"] as Array<any>) || [];

  console.log("miningResult", miningResult);
  // add to current good order
  const id = await generateHashForOrder(
    miningResult.miningOrderItems
      .sort((a, b) => a.price - b.price)
      .map((item) => {
        return {
          count: item.quantity,
          code: item.productId,
        };
      })
  );
  const existingGoodOrder = goodOrderList.find((i) => i.id === id);

  // do nothing
  if (existingGoodOrder) return;

  const goodOrder = {
    ...miningResult,
    id: id,
  };

  goodOrderList.push(goodOrder);

  await chrome.storage.local.set({
    "good-order-list": goodOrderList,
  });

  console.log("Good Order to storage", goodOrder);
}

function onUpdateNumberOfJobs(target: MatchOrders, numberOfJobs: number) {
  console.log("onUpdateNumberOfJobs", numberOfJobs);

  chrome.runtime.sendMessage({
    type: "update-number-of-jobs",
    data: {
      numberOfJobs,
    },
  });
}

async function getMatchListFromStorage(): Promise<MatchItem[]> {
  const data = await chrome.storage.local.get(["match-list"]);
  const matchList: Array<any> = (data["match-list"] as Array<any>) || [];
  return matchList;
}

async function setMatchListToStorage(matchList: MatchItem[]): Promise<void> {
  // ok it just change the value of key but not delete other key :#
  return await chrome.storage.local.set({
    "match-list": matchList,
  });
}

async function addProductToMatchListStorage(item: MatchItem): Promise<boolean> {
  const matchList = await getMatchListFromStorage();

  const existingProduct = matchList.find((i) => i.productId === item.productId);

  if (existingProduct) {
    return false;
  }

  matchList.push(item);

  await setMatchListToStorage(matchList);

  return true;
}

async function sugarAddProductToMatchListStorage(
  item: MatchItem | IherbModifyItem
): Promise<boolean> {
  const matchList = await getMatchListFromStorage();

  const existingProduct = matchList.find((i) => i.productId === item.productId);

  if (existingProduct) {
    return true;
  }

  // just check is name properties exist
  if ((item as MatchItem).name) {
    await addProductToMatchListStorage(item as MatchItem);
    return true;
  }
  // it just iherb modify item
  if (!serviceInstance.iherbCheckoutApi) {
    serviceInstance.iherbCheckoutApi = new IherbCheckoutApi();
    serviceInstance.iherbCheckoutApi.setCustomRequestMethod(
      delegateApiRequestMethod
    );
  }

  const iherbItem: IherbItem =
    await serviceInstance.iherbCheckoutApi.mapOnceItem(item as IherbModifyItem);

  return await addProductToMatchListStorage({
    productId: iherbItem.productId,
    name: iherbItem.name,
    price: iherbItem.price,
    weight: iherbItem.weight,
    image: iherbItem.image,
  });
}

async function delegateApiRequestMethod(
  url: string,
  init: RequestInit
): Promise<ResponseIherbApi> {
  const [tab] = await chrome.tabs.query({
    active: true,
    url: ["*://vn.iherb.com/*", "*://checkout9.iherb.com/*"],
  });

  // tab is unactive
  if (!tab && !serviceInstance.tabId) {
    return {
      ok: false,
      status: TAB_UNACTIVE_ERROR,
      json: () =>
        Promise.resolve({
          message: "Tab is not active",
        }),
    };
  }

  if (!tab && serviceInstance.tabId) {
    console.log("Try use backup tabId", serviceInstance.tabId);
  }

  // snapshot tabId
  if (tab) serviceInstance.tabId = tab.id;

  let response: any;
  try {
    // make request via content script
    response = await chrome.tabs.sendMessage(
      // try to use backup tab id
      (tab?.id as number) || (serviceInstance.tabId as number),
      {
        type: "api-request",
        data: {
          url,
          init,
        },
      }
    );
  } catch {
    return {
      ok: false,
      status: TAB_UNACTIVE_ERROR,
      json: () =>
        Promise.resolve({
          message: "Tab is not active",
        }),
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    json: () => new Promise((resolve) => resolve(response.data)),
  };
}

async function initMatchOrders() {
  // already init
  if (serviceInstance.matchOrders) return;

  if (!serviceInstance.iherbCheckoutApi) {
    serviceInstance.iherbCheckoutApi = new IherbCheckoutApi();
    serviceInstance.iherbCheckoutApi.setCustomRequestMethod(
      delegateApiRequestMethod
    );
  }

  serviceInstance.matchOrders = new MatchOrders(
    serviceInstance.iherbCheckoutApi
  );
  await serviceInstance.matchOrders.init();

  serviceInstance.matchOrders.addListener("found-good-order", onFoundGoodOrder);
  serviceInstance.matchOrders.addListener(
    "update-number-jobs",
    onUpdateNumberOfJobs
  );

  console.log("matchOrders", JSON.stringify(serviceInstance.matchOrders));
}

async function addProductToMatchOrders(newItem: IherbModifyItem) {
  // matchOrders not init so create new instance
  if (!serviceInstance.matchOrders) await initMatchOrders();
  // add to product match
  serviceInstance.matchOrders?.addMatchItem(newItem);
}

function removeProductFromMatchOrders(item: IherbModifyItem) {
  // nothing to do
  if (!serviceInstance.matchOrders) return;

  serviceInstance.matchOrders.removeMatchItem(item);
}

function clearAllProductMatchOrders() {
  // nothing to do
  if (!serviceInstance.matchOrders) return;
  serviceInstance.matchOrders.clearMatchItems();
}
async function getCartInfo(): Promise<CartInfo> {
  if (serviceInstance.cartInfo)
    return Promise.resolve(serviceInstance.cartInfo);

  if (!serviceInstance.iherbCheckoutApi) {
    serviceInstance.iherbCheckoutApi = new IherbCheckoutApi();
    serviceInstance.iherbCheckoutApi.setCustomRequestMethod(
      delegateApiRequestMethod
    );
  }

  serviceInstance.cartInfo = await serviceInstance.iherbCheckoutApi.cartInfo();

  return serviceInstance.cartInfo;
}

// add product to match -> trigger automatic mining orders
async function handleAddProduct(productId: string): Promise<boolean> {
  const ok = await sugarAddProductToMatchListStorage({
    productId: parseInt(productId),
  });

  // item already exist repeat do nothing
  if (!ok) return true;

  // add to match orders task
  addProductToMatchOrders({
    productId: parseInt(productId),
  });

  return true;
}

// get match list items to display
async function handleGetMatchList(): Promise<MatchItem[]> {
  const matchList = await getMatchListFromStorage();
  return matchList;
}

async function handleGetGoodOrderList(): Promise<GoodOrder[]> {
  const data = await chrome.storage.local.get(["good-order-list"]);
  const goodOrderList: Array<GoodOrder> =
    (data["good-order-list"] as Array<any>) || [];
  console.log("Good order list", goodOrderList);
  return goodOrderList;
}

async function handleRemoveMatchItem(
  iherbModifyItem: IherbModifyItem
): Promise<boolean> {
  let matchList = await getMatchListFromStorage();
  matchList = matchList.filter(
    (item) => item.productId !== iherbModifyItem.productId
  );
  await setMatchListToStorage(matchList);
  removeProductFromMatchOrders(iherbModifyItem);
  return true;
}

async function handleClearMatchList(): Promise<boolean> {
  await setMatchListToStorage([]);
  clearAllProductMatchOrders();
  return true;
}

async function handleRemoveGoodOrder(goodOrderId: string): Promise<boolean> {
  const data = await chrome.storage.local.get(["good-order-list"]);
  let goodOrderList: Array<GoodOrder> =
    (data["good-order-list"] as Array<any>) || [];

  goodOrderList = goodOrderList.filter((o) => o.id !== goodOrderId);

  await chrome.storage.local.set({
    "good-order-list": goodOrderList,
  });

  return true;
}

async function handleGetCartInfo(): Promise<CartInfo> {
  return await getCartInfo();
}

async function handleSetAutoMatch(autoMatch: boolean): Promise<boolean> {
  console.log("handleSetAutoMatch", autoMatch);
  // matchOrders not init so create new instance
  if (!serviceInstance.matchOrders) await initMatchOrders();

  if (autoMatch) {
    const matchList = await getMatchListFromStorage();
    await serviceInstance.matchOrders?.start(matchList);
  }
  if (!autoMatch) serviceInstance.matchOrders?.stop();

  await chrome.storage.local.set({
    "auto-match": autoMatch,
  });

  return autoMatch;
}

async function handleGetAutoMatch(): Promise<boolean> {
  const data = await chrome.storage.local.get(["auto-match"]);
  // if there are not have any value so default is true
  const autoMatch =
    data["auto-match"] === undefined ? true : data["auto-match"];
  return autoMatch;
}

async function handleGetExtensionReady(): Promise<ExtensionState> {
  if (!serviceInstance.extensionState) return await initExtensionState();
  return serviceInstance.extensionState;
}

async function handleOnPageLoad() {
  if (!serviceInstance.extensionState)
    serviceInstance.extensionState = await initExtensionState();
  if (!serviceInstance.extensionState.isReady)
    serviceInstance.extensionState = await initExtensionState();

  console.log(
    "Get extension state on page load",
    serviceInstance.extensionState
  );

  if (serviceInstance.extensionState.isReady) {
    chrome.runtime.sendMessage({
      type: "update-cart-info",
      data: {
        cartInfo: serviceInstance.cartInfo,
      },
    });
  }

  chrome.runtime.sendMessage({
    type: "update-extension-state",
    data: {
      extensionState: serviceInstance.extensionState,
    },
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.type) {
    case "on-page-load":
      handleOnPageLoad();
      return false;
    case "get-extension-ready":
      handleGetExtensionReady().then((extensionState) => {
        sendResponse({
          extensionState,
        });
      });
      return true;
    case "add-product":
      // i don't like the way it use then :((
      handleAddProduct(request.data.productId as string).then((ok) => {
        sendResponse({
          state: true,
        });
      });
      return true;
    case "get-match-list":
      handleGetMatchList().then((matchList) => {
        sendResponse({
          matchList,
        });
      });
      return true;
    case "remove-match-item":
      handleRemoveMatchItem({
        productId: request.data.productId,
      }).then((ok) =>
        sendResponse({
          state: ok,
        })
      );
      return true;
    case "clear-match-items":
      handleClearMatchList().then((ok) =>
        sendResponse({
          state: ok,
        })
      );
      return true;
    case "get-good-order-list":
      handleGetGoodOrderList().then((goodOrderList) => {
        sendResponse({
          goodOrderList,
        });
      });
      return true;
    case "remove-good-order":
      handleRemoveGoodOrder(request.data.goodOrderId).then((ok) => {
        sendResponse({
          state: ok,
        });
      });
      return true;
    case "get-cart-info":
      handleGetCartInfo().then((cartInfo) => {
        sendResponse({
          cartInfo,
        });
      });
      return true;
    case "set-auto-match":
      handleSetAutoMatch(request.data.autoMatch).then((autoMatch) => {
        sendResponse({
          autoMatch,
        });
      });
      return true;
    case "get-auto-match":
      handleGetAutoMatch().then((autoMatch) => {
        sendResponse({
          autoMatch,
        });
      });
      return true;

    default:
      break;
  }
});
