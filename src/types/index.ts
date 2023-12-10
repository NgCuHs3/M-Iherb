import { Dispatch } from "react";
import { ExtensionState, GoodOrder, MatchItem } from "../../service-worker";
import { CartInfo } from "../../core/IherbCheckoutApi";
import { AuthenticateState } from "../../core/UserAuthentication";

export interface ISidePanelContext {
  sidePanelState: SidePanelState;
  removeMatchItem: (productId: number) => Promise<boolean>;
  clearMatchItems: () => Promise<boolean>;
  dispatchSidePanelState: Dispatch<SidePanelStateReducer>;
  removeGoodOrder: (goodOrderId: string) => Promise<boolean>;
  setAutoMatch: (autoMatch: boolean) => Promise<boolean>;
}

export interface SidePanelState {
  authenticatedState: AuthenticateState;
  matchItemList: MatchItem[];
  goodOrderList: GoodOrder[];
  cartInfo: CartInfo;
  numberOfJobs: number;
  autoMatch: boolean;
  extensionState: ExtensionState;
}

export enum SidePanelStateAction {
  SetAuthenticatedState = "setAuthenticatedState",
  SetMatchList = "setMatchList",
  SetGoodOrderList = "setGoodOrderList",
  SetCartInfo = "setCartInfo",
  SetNumberOfJobs = "setNumberOfJobs",
  SetAutoMatch = "setAutoMatch",
  SetExtensionState = "setExtensionState",
}

export type SidePanelStateReducer =
  | {
      type: SidePanelStateAction.SetAuthenticatedState;
      payload: Pick<SidePanelState, "authenticatedState">;
    }
  | {
      type: SidePanelStateAction.SetMatchList;
      payload: Pick<SidePanelState, "matchItemList">;
    }
  | {
      type: SidePanelStateAction.SetGoodOrderList;
      payload: Pick<SidePanelState, "goodOrderList">;
    }
  | {
      type: SidePanelStateAction.SetCartInfo;
      payload: Pick<SidePanelState, "cartInfo">;
    }
  | {
      type: SidePanelStateAction.SetNumberOfJobs;
      payload: Pick<SidePanelState, "numberOfJobs">;
    }
  | {
      type: SidePanelStateAction.SetAutoMatch;
      payload: Pick<SidePanelState, "autoMatch">;
    }
  | {
      type: SidePanelStateAction.SetExtensionState;
      payload: Pick<SidePanelState, "extensionState">;
    };
