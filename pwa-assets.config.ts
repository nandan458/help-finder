// Makes every app icon size phones need (home screen, Android, iPhone, browser tab)
// from one drawing, public/logo.svg. Run `npm run icons` after changing the drawing.
import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// logo.svg already fills the square and keeps the pin inside the safe middle area,
// so the generator shouldn't add its own white border around it.
const noPadding = { padding: 0, resizeOptions: { background: "#0a66c2" } };

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, ...noPadding },
    maskable: { ...minimal2023Preset.maskable, ...noPadding },
    apple: { ...minimal2023Preset.apple, ...noPadding },
  },
  images: ["public/logo.svg"],
});
