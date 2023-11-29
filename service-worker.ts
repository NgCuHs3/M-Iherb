import { IherbModifyItem, MiningOrderItem } from "./core/IherbCheckoutApi";
import MatchOrders from "./core/MatchOrders";

type ServiceInstance = {
  matchOrders: MatchOrders | undefined;
};

const serviceInstance: ServiceInstance = {
  matchOrders: undefined,
};

// const serviceState = {};

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

async function onFoundGoodOrder(
  orderList: MiningOrderItem[],
  currentOrder: MiningOrderItem
) {
  console.log("orderList", orderList);
  console.log("Found one new good order", currentOrder);
}

async function initMatchOrders(iherbItems: IherbModifyItem[]) {
  // already init
  if (serviceInstance.matchOrders) return;
  serviceInstance.matchOrders = new MatchOrders();
  await serviceInstance.matchOrders.init();

  console.log("matchOrders", JSON.stringify(serviceInstance.matchOrders));

  //await serviceInstance.matchOrders.start(iherbItems);
}

async function addProductToMatchOrders(item: IherbModifyItem) {
  // matchOrders not init so create new instance
  if (!serviceInstance.matchOrders) {
    const data = await chrome.storage.local.get(["match-list"]);
    const matchList: Array<any> = (data["match-list"] as Array<any>) || [];
    await initMatchOrders(matchList as IherbModifyItem[]);
  }

  // add to product match
  //serviceInstance.matchOrders?.addMatchItem(item);
}

async function removeProductFromMatchOrders(item: IherbModifyItem) {
  // nothing to do
  if (!serviceInstance.matchOrders) return;
}

// add product to match -> trigger automatic scan orders
async function handleAddProduct(productId: string): Promise<boolean> {
  const data = await chrome.storage.local.get(["match-list"]);
  const matchList: Array<any> = (data["match-list"] as Array<any>) || [];

  const existingProduct = matchList.find(
    (item: { productId: string }) => item.productId === productId
  );

  if (existingProduct) {
    return true;
  }

  matchList.push({
    productId,
  });

  // add to match orders task
  addProductToMatchOrders({
    productId: parseInt(productId),
  });

  // ok it just change the value of key but not delete other key :#
  await chrome.storage.local.set({
    "match-list": matchList,
  });

  return true;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.type) {
    case "add-product":
      // i don't like the way it use then :((
      handleAddProduct(request.data.productId as string).then((ok) => {
        sendResponse({
          state: true,
        });
      });
      break;
    default:
      break;
  }
  return true;
});
