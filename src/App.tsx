import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import "./App.css";
import { useState } from "react";
import MatchList from "./MatchList";
import OrderList from "./OrderList";
import Info from "./Info";
import Settings from "./Settings";
import { useSidePanelContext } from "./contexts/SidePanelContext";
import { TAB_UNACTIVE_ERROR, ZIP_CODE_NOT_APPLIED } from "../core/error";

function App() {
  const { sidePanelState } = useSidePanelContext();
  const { login, register, logout } = useKindeAuth();
  const [tabIndex, setTabIndex] = useState(2);

  const changeTab = (tabIndex: number) => setTabIndex(tabIndex);

  const detach = () => {
    chrome.tabs.create({ url: "http://localhost:3000?a=123" });
  };
  // chrome.windows.create({
  //   type: "normal",
  //   width: 400,
  //   height: 600,
  //   url: "js/index.html",
  // });

  return (
    <div className="App h-full text-neutral">
      {!sidePanelState.extensionState.isReady &&
        sidePanelState.extensionState.error?.code === TAB_UNACTIVE_ERROR && (
          <div className="flex flex-col items-center">
            <p className="text-lg font-bold">Extension not ready !</p>
            <p>Open least one Iherb page to start</p>
            <button
              className="btn mt-4"
              onClick={() =>
                chrome.tabs.create({ url: "https://vn.iherb.com" })
              }
            >
              Go to Iherb
            </button>
          </div>
        )}
      {!sidePanelState.extensionState.isReady &&
        sidePanelState.extensionState.error?.code === ZIP_CODE_NOT_APPLIED && (
          <div className="flex flex-col items-center">
            <p className="text-lg font-bold">Extension not ready !</p>
            <p>Please apply zip code to get shiiping information</p>
            <button
              className="btn mt-4"
              onClick={() =>
                chrome.tabs.create({ url: "https://checkout9.iherb.com/cart" })
              }
            >
              Go to Iherb
            </button>
          </div>
        )}
      {sidePanelState.extensionState.isReady && (
        <div role="tablist" className="tabs tabs-lifted ">
          {/* Order List */}
          <input
            type="radio"
            name="order_list"
            role="tab"
            className="tab whitespace-nowrap"
            aria-label="Order List"
            checked={tabIndex === 0}
            onClick={() => changeTab(0)}
          />
          <div
            role="tabpanel"
            className="tab-content bg-base-100 border-base-300 rounded-box p-6"
          >
            <OrderList></OrderList>
          </div>

          {/* Match List */}
          <input
            type="radio"
            name="match_list"
            role="tab"
            className="tab whitespace-nowrap"
            aria-label="Match List"
            checked={tabIndex === 1}
            onClick={() => changeTab(1)}
          />
          <div
            role="tabpanel"
            className="tab-content bg-base-100 border-base-300 rounded-box p-6 "
          >
            <MatchList></MatchList>
          </div>

          {/* Info tab */}

          <input
            type="radio"
            name="more"
            role="tab"
            className="tab whitespace-nowrap"
            aria-label="More"
            checked={tabIndex === 2}
            onClick={() => changeTab(2)}
          />
          <div
            role="tabpanel"
            className="tab-content bg-base-100 border-base-300 rounded-box p-6"
          >
            <Settings></Settings>
            <Info></Info>
            <p className="mt-10">
              Contact author: <b>Cuninjazas3@gmail.com</b>
            </p>
          </div>
        </div>
      )}
    </div>
    // {/*User auth*/}
    // // <div>
    // //   <button onClick={() => detach()} type="button">
    // //     Register
    // //   </button>
    // //   <button onClick={() => login()} type="button">
    // //     Log In
    // //   </button>
    // //   <button onClick={() => logout()}>Logout</button>
    // // </div>
  );
}

export default App;
