import React from "react";
import "./App.css";
import { useState } from "react";
import MatchList from "./MatchList";
import OrderList from "./OrderList";
import Info from "./Info";
import Settings from "./Settings";

function App() {
  console.log("HELLOW WORLD");

  const [tabIndex, setTabIndex] = useState(2);

  const changeTab = (tabIndex: number) => setTabIndex(tabIndex);

  return (
    <div className="App h-full text-neutral">
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
    </div>
  );
}

export default App;
