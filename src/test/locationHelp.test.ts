import { describe, expect, it } from "vitest";
import { locationHelpKind } from "../lib/locationHelp";

// Real user-agent strings from common phones and apps.
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const CHROME_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1";
const IPHONE_MINI_BROWSER_IN_AN_APP =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const INSTAGRAM_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
const FACEBOOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0]";
const ANDROID_WEB_VIEW =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36";
const CHROME_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

describe("locationHelpKind", () => {
  it("recognizes normal iPhone browsers", () => {
    expect(locationHelpKind(SAFARI_IPHONE)).toBe("ios");
    expect(locationHelpKind(CHROME_IPHONE)).toBe("ios");
  });

  it("recognizes links opened inside other apps", () => {
    expect(locationHelpKind(INSTAGRAM_IPHONE)).toBe("inApp");
    expect(locationHelpKind(IPHONE_MINI_BROWSER_IN_AN_APP)).toBe("inApp");
    expect(locationHelpKind(FACEBOOK_ANDROID)).toBe("inApp");
    expect(locationHelpKind(ANDROID_WEB_VIEW)).toBe("inApp");
  });

  it("doesn't call a home screen app on iPhone a mini browser", () => {
    expect(locationHelpKind(IPHONE_MINI_BROWSER_IN_AN_APP, true)).toBe("ios");
  });

  it("recognizes Android Chrome and everything else", () => {
    expect(locationHelpKind(CHROME_ANDROID)).toBe("android");
    expect(locationHelpKind(CHROME_WINDOWS)).toBe("other");
  });
});
