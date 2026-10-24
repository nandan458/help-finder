import { registerSW } from "virtual:pwa-register";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { I18nProvider } from "./i18n/I18nProvider";
import { applySavedSettings } from "./lib/settings";
import "./styles/tokens.css";
import "./styles/base.css";

// Keep the app up to date. When a new version has been published, the browser
// downloads it in the background, and this reloads the page once so the person
// gets it right away. Without this, an old saved copy keeps running until the app
// is closed and opened a second time. "immediate" checks for a new version at startup.
registerSW({ immediate: true });

// Set light/dark and text size before drawing anything, so nothing flashes.
applySavedSettings();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
