import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { store } from "./store/store";
import { startPresenceListener } from "./store/presenceSlice";


// ========================================
// 🔥 START PRESENCE LISTENER (GLOBAL)
// ========================================
store.dispatch(startPresenceListener());


// ========================================
// 🔥 RENDER APP
// ========================================
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);