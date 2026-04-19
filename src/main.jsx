import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import "./index.css"; 
import App from "./App.jsx";
import { store } from "./store/store";
import { startPresenceListener, reEvaluatePresence } from "./store/presenceSlice";
import { initDB } from "./utils/indexedDB"; 


initDB(); 


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
