import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import "./App.css";
import { useState } from "react";
import MatchList from "./MatchList";
import OrderList from "./OrderList";
import Info from "./Info";
import Settings from "./Settings";
import { useSidePanelContext } from "./contexts/SidePanelContext";
import { TAB_UNACTIVE_ERROR, ZIP_CODE_NOT_APPLIED } from "../core/error";

const development = process.env.WEBPACK_ENV === "development";

function App() {
  const { sidePanelState } = useSidePanelContext();
  const { isLoading } = useKindeAuth();
  const [tabIndex, setTabIndex] = useState(2);
  const {
    sidePanelState: { authenticatedState },
  } = useSidePanelContext();

  const changeTab = (tabIndex: number) => setTabIndex(tabIndex);

  if (isLoading) {
    return <p>Loading</p>;
  }

  if (authenticatedState === "unauthenticated" && !development)
    return (
      <div className="hero min-h-screen">
        <div className="hero-content text-center ">
          <div className="max-w-md gap-x-2">
            <h1 className="text-5xl font-bold">Hello there 👋</h1>
            <p className="py-6">Please log in 🔐 to continue !</p>
            <div className="flex flex-row justify-center gap-x-4">
              <button
                className="btn btn-primary"
                onClick={() => {
                  chrome.tabs.create({
                    url: "http://localhost:3000?action=login",
                  });
                }}
              >
                Log In
              </button>
              <button
                className="btn btn-primary btn-outline"
                onClick={() => {
                  chrome.tabs.create({
                    url: "http://localhost:3000?action=register",
                  });
                }}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  if (authenticatedState === "another-authenticated" && !development)
    return (
      <div className="hero min-h-screen bg-white">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold">Another authenticated</h1>
            <p className="py-6">
              There is another session from this account 🪪 please log out that
              session to continue . Or if there is mistake please wait 15 ⏲️
              minutes to try again.
            </p>
            <button className="btn btn-primary">OK</button>
          </div>
        </div>
      </div>
    );

  if (authenticatedState === "authenticated" || development)
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
          sidePanelState.extensionState.error?.code ===
            ZIP_CODE_NOT_APPLIED && (
            <div className="flex flex-col items-center">
              <p className="text-lg font-bold">Extension not ready !</p>
              <p>Please apply zip code to get shiiping information</p>
              <button
                className="btn mt-4"
                onClick={() =>
                  chrome.tabs.create({
                    url: "https://checkout9.iherb.com/cart",
                  })
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
    );
  return (
    <div>
      <p>Empty page !</p>
    </div>
  );
}

export default App;
