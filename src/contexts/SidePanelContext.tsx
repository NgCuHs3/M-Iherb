import {
  Dispatch,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import {
  SidePanelState,
  ISidePanelContext,
  SidePanelStateReducer,
  SidePanelStateAction,
} from "../types";
import { CartInfo } from "../../core/IherbCheckoutApi";
import { ExtensionState } from "../../service-worker";

export const appStateReducer = (
  state: SidePanelState,
  { type, payload }: SidePanelStateReducer
): SidePanelState => {
  switch (type) {
    case SidePanelStateAction.SetMatchList:
      return { ...state, matchItemList: payload.matchItemList };
    case SidePanelStateAction.SetGoodOrderList:
      return { ...state, goodOrderList: payload.goodOrderList };
    case SidePanelStateAction.SetCartInfo:
      return { ...state, cartInfo: payload.cartInfo };
    case SidePanelStateAction.SetNumberOfJobs:
      return { ...state, numberOfJobs: payload.numberOfJobs };
    case SidePanelStateAction.SetAutoMatch:
      return { ...state, autoMatch: payload.autoMatch };
    case SidePanelStateAction.SetExtensionState:
      return { ...state, extensionState: payload.extensionState };
    default:
      return state;
  }
};

const defaultSidePanelState: SidePanelState = {
  matchItemList: [],
  goodOrderList: [],
  cartInfo: {
    freeShippingMinSpend: 0,
    subTotalLimit: 0,
  },
  numberOfJobs: 0,
  autoMatch: false,
  extensionState: {
    isReady: false,
    error: undefined,
    isHealthy: false,
  },
};

export const SidePanelContext = createContext<ISidePanelContext>({
  sidePanelState: defaultSidePanelState,
  removeMatchItem: () => Promise.resolve(false),
  clearMatchItems: () => Promise.resolve(false),
  dispatchSidePanelState: () => {},
  removeGoodOrder: () => Promise.resolve(false),
  setAutoMatch: () => Promise.resolve(false),
});

export const useSidePanelContext = () => useContext(SidePanelContext);

const SidePanelContextProvider = ({ children }: { children: ReactNode }) => {
  const [sidePanelState, dispatchSidePanelState] = useReducer(
    appStateReducer,
    defaultSidePanelState
  );

  // get match list data
  useEffect(() => {
    getBasicData(dispatchSidePanelState);
    registerServiceWorkerEvent(dispatchSidePanelState);
    registerStorageEvent(dispatchSidePanelState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sidePanelContextProviderData = {
    sidePanelState,
    removeMatchItem,
    clearMatchItems,
    dispatchSidePanelState,
    removeGoodOrder,
    setAutoMatch,
  };

  return (
    <SidePanelContext.Provider value={sidePanelContextProviderData}>
      {children}
    </SidePanelContext.Provider>
  );
};

export default SidePanelContextProvider;

async function getBasicData(
  dispatchSidePanelState: Dispatch<SidePanelStateReducer>
) {
  const extensionState = await getExtensionReady();
  const matchList = await getMatchList();
  const goodOrderList = await getGoodOrderList();
  // const cartInfo = await getCartInfo();
  const autoMatch = await getAutoMatch();

  dispatchSidePanelState({
    type: SidePanelStateAction.SetExtensionState,
    payload: {
      extensionState: extensionState,
    },
  });
  dispatchSidePanelState({
    type: SidePanelStateAction.SetMatchList,
    payload: {
      matchItemList: matchList,
    },
  });
  dispatchSidePanelState({
    type: SidePanelStateAction.SetGoodOrderList,
    payload: {
      goodOrderList: goodOrderList,
    },
  });
  // dispatchSidePanelState({
  //   type: SidePanelStateAction.SetCartInfo,
  //   payload: {
  //     cartInfo: cartInfo,
  //   },
  // });
  dispatchSidePanelState({
    type: SidePanelStateAction.SetAutoMatch,
    payload: {
      autoMatch: autoMatch,
    },
  });
}

async function clearMatchItems(): Promise<boolean> {
  const { state } = await chrome.runtime.sendMessage({
    type: "clear-match-items",
  });
  return state;
}

async function removeMatchItem(productId: number): Promise<boolean> {
  console.log("Remove match item", productId);
  const { state } = await chrome.runtime.sendMessage({
    type: "remove-match-item",
    data: {
      productId,
    },
  });
  return state;
}

async function getMatchList() {
  const { matchList } = await chrome.runtime.sendMessage({
    type: "get-match-list",
  });
  return matchList;
}

async function getGoodOrderList() {
  const { goodOrderList } = await chrome.runtime.sendMessage({
    type: "get-good-order-list",
  });
  return goodOrderList;
}

async function getCartInfo(): Promise<CartInfo> {
  const { cartInfo } = await chrome.runtime.sendMessage({
    type: "get-cart-info",
  });
  return cartInfo;
}

async function getExtensionReady(): Promise<ExtensionState> {
  const { extensionState } = await chrome.runtime.sendMessage({
    type: "get-extension-ready",
  });
  return extensionState;
}

async function getAutoMatch(): Promise<boolean> {
  const { autoMatch } = await chrome.runtime.sendMessage({
    type: "get-auto-match",
  });
  return autoMatch;
}

async function removeGoodOrder(goodOrderId: string): Promise<boolean> {
  console.log("Remove good order", goodOrderId);
  const { state } = await chrome.runtime.sendMessage({
    type: "remove-good-order",
    data: {
      goodOrderId,
    },
  });
  return state;
}

async function setAutoMatch(autoMatch: boolean): Promise<boolean> {
  console.log("Set auto match", autoMatch);
  const { autoMatch: newAutoMatch } = await chrome.runtime.sendMessage({
    type: "set-auto-match",
    data: {
      autoMatch,
    },
  });
  return newAutoMatch;
}
// handle event from service worker
function registerServiceWorkerEvent(
  dispatchSidePanelState: Dispatch<SidePanelStateReducer>
) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case "update-number-of-jobs":
        dispatchSidePanelState({
          type: SidePanelStateAction.SetNumberOfJobs,
          payload: {
            numberOfJobs: message.data.numberOfJobs,
          },
        });
        return;
      case "update-extension-state":
        dispatchSidePanelState({
          type: SidePanelStateAction.SetExtensionState,
          payload: {
            extensionState: message.data.extensionState,
          },
        });
        break;
      case "update-cart-info":
        dispatchSidePanelState({
          type: SidePanelStateAction.SetCartInfo,
          payload: {
            cartInfo: message.data.cartInfo,
          },
        });
        break;
    }
  });
}

// handle event change in storage
function registerStorageEvent(
  dispatchSidePanelState: Dispatch<SidePanelStateReducer>
) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (const [key, storageChange] of Object.entries(changes)) {
      switch (key) {
        case "match-list":
          dispatchSidePanelState({
            type: SidePanelStateAction.SetMatchList,
            payload: {
              matchItemList: storageChange.newValue,
            },
          });
          break;
        case "good-order-list":
          dispatchSidePanelState({
            type: SidePanelStateAction.SetGoodOrderList,
            payload: {
              goodOrderList: storageChange.newValue,
            },
          });
          break;
        case "auto-match":
          console.log(
            "auto-match --> from strorage listen",
            storageChange.newValue
          );
          dispatchSidePanelState({
            type: SidePanelStateAction.SetAutoMatch,
            payload: {
              autoMatch: storageChange.newValue,
            },
          });
          break;
        default:
          break;
      }
    }
  });
}
