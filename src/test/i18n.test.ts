import { describe, expect, it } from "vitest";
import { LANGUAGES, pickStartLanguage, translate } from "../i18n/translate";

describe("translations", () => {
  const english = Object.keys(LANGUAGES.en);

  // Catches a forgotten translation before a Spanish speaker does.
  it.each(Object.keys(LANGUAGES))("%s has every key English has", (lang) => {
    expect(Object.keys(LANGUAGES[lang]).sort()).toEqual([...english].sort());
  });

  it("fills in placeholders", () => {
    expect(translate("en", "distance.walk", { minutes: 5 })).toBe("5 min walk");
    expect(translate("es", "distance.walk", { minutes: 5 })).toBe("5 min a pie");
  });

  it("picks singular or plural", () => {
    expect(translate("en", "results.count", { count: 1, radius: "2 km" })).toBe(
      "1 place within 2 km",
    );
    expect(translate("es", "results.count", { count: 3, radius: "2 km" })).toBe(
      "3 lugares a menos de 2 km",
    );
  });

  it("falls back to the key instead of showing nothing", () => {
    expect(translate("es", "no.such.key")).toBe("no.such.key");
  });
});

describe("pickStartLanguage", () => {
  it("prefers the saved choice", () => {
    expect(pickStartLanguage("es", ["en-US"])).toBe("es");
  });

  it("uses the phone's language when nothing is saved", () => {
    expect(pickStartLanguage(null, ["es-MX", "en-US"])).toBe("es");
  });

  it("falls back to English", () => {
    expect(pickStartLanguage(null, ["zz-ZZ"])).toBe("en");
    expect(pickStartLanguage("xx", [])).toBe("en");
  });
});
