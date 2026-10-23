import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { I18nProvider } from "./i18n/I18nProvider";
import { applySavedSettings } from "./lib/settings";
import "./styles/tokens.css";
import "./styles/base.css";

// Set light/dark and text size before drawing anything, so nothing flashes.
applySavedSettings();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
