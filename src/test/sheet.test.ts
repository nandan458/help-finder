import { describe, expect, it } from "vitest";
import { closestSize, sheetHeight } from "../components/sheetSize";
import { pickLocale } from "../i18n/translate";

describe("bottom sheet sizes", () => {
  const screen = 740; // a small Android phone

  it("has three heights, smallest to largest", () => {
    expect(sheetHeight("peek", screen)).toBe(168);
    expect(sheetHeight("half", screen)).toBe(370);
    expect(sheetHeight("full", screen)).toBe(668);
  });

  it("snaps to the closest height when you let go", () => {
    expect(closestSize(200, screen)).toBe("peek");
    expect(closestSize(400, screen)).toBe("half");
    expect(closestSize(600, screen)).toBe("full");
  });
});

describe("pickLocale", () => {
  it("uses the phone's region when it matches the app's language", () => {
    expect(pickLocale("es", ["en-US", "es-US"])).toBe("es-US");
    expect(pickLocale("en", ["en-GB"])).toBe("en-GB");
  });

  it("falls back to the plain language", () => {
    expect(pickLocale("es", ["en-US"])).toBe("es");
  });
});
