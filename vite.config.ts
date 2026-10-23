import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, type Plugin } from "vitest/config";
import { APP_NAME } from "./src/config.ts";

// Replaces %APP_NAME% in index.html, so the name is only written in src/config.ts.
function appName(): Plugin {
  return {
    name: "app-name",
    transformIndexHtml: (html) => html.replaceAll("%APP_NAME%", APP_NAME),
  };
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/, not from /. The deploy
  // workflow (.github/workflows/deploy.yml) sets BASE_PATH to that folder.
  base: process.env.BASE_PATH ?? "/",
  build: {
    // The opening-hours library is about 700 kB, over Vite's 500 kB warning line.
    // It's already loaded separately, after the app starts (see src/lib/hours.ts),
    // so the warning doesn't apply.
    chunkSizeWarningLimit: 800,
  },
  plugins: [
    react(),
    appName(),
    // Makes the app installable ("Add to Home Screen") and work offline.
    // It adds a "service worker": a small script the browser keeps that can
    // answer requests from a copy saved on the phone when there's no signal.
    VitePWA({
      registerType: "autoUpdate", // a new version installs itself on the next visit
      includeAssets: ["favicon.ico", "favicon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        description:
          "Find free food, health care, shelter, internet, water, and restrooms near you.",
        lang: "en",
        theme_color: "#0a66c2",
        background_color: "#f2f2f7",
        display: "standalone", // opens like an app, without the browser's address bar
        start_url: ".",
        scope: ".",
        // Made by `npm run icons` from public/logo.svg.
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable", // Android may crop this one into a circle or squircle
          },
        ],
      },
      workbox: {
        // Save the whole app (code, styles, icons) on the phone, so it opens offline.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        runtimeCaching: [
          {
            // Map pictures you've already looked at, so the map still shows offline.
            // Capped at 300 tiles for a week, so it never fills up a cheap phone.
            // (Search results are saved separately, by src/lib/cache.ts.)
            urlPattern: ({ url }) => url.hostname === "tile.openstreetmap.org",
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
