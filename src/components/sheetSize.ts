// The three heights of the phone's bottom sheet (see Sheet.tsx).

export type SheetSize = "peek" | "half" | "full";
export const SHEET_SIZES: SheetSize[] = ["peek", "half", "full"];

/** How tall each size is, in pixels, on a screen `screenHeight` tall. */
export function sheetHeight(size: SheetSize, screenHeight: number): number {
  if (size === "peek") return 168; // the title and search box
  if (size === "half") return Math.round(screenHeight * 0.5);
  return screenHeight - 72; // leaves a strip of map showing at the top
}

/** The size whose height is closest to `height` (used when you let go of a drag). */
export function closestSize(height: number, screenHeight: number): SheetSize {
  return SHEET_SIZES.reduce((best, size) =>
    Math.abs(sheetHeight(size, screenHeight) - height) <
    Math.abs(sheetHeight(best, screenHeight) - height)
      ? size
      : best,
  );
}
