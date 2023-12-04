import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import SidePanelContextProvider from "./contexts/SidePanelContext";
import { KindeProvider } from "@kinde-oss/kinde-auth-react";

const root = document.createElement("div");
root.className = "container";
document.body.appendChild(root);
const rootDiv = ReactDOM.createRoot(root);
rootDiv.render(
  <React.StrictMode>
    <KindeProvider
      clientId="64212213db8e4b56b2cccf7dc167fcef"
      domain="https://myhs3.kinde.com"
      redirectUri="chrome-extension://cgfboccdannakhkbfcjcpjmpmdfocgin/js/index.html"
      logoutUri="chrome-extension://cgfboccdannakhkbfcjcpjmpmdfocgin/js/index.html"
    >
      <SidePanelContextProvider>
        <App />
      </SidePanelContextProvider>
    </KindeProvider>
  </React.StrictMode>
);
