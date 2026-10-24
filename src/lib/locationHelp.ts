// When the browser refuses to share the location, the most useful thing we can do
// is say WHY and show the exact steps for this phone. There are four common cases:
//
//   inApp    the link was opened inside another app (Messages, Instagram, Facebook...),
//            whose mini browser blocks location. The fix is "Open in Safari/Chrome".
//   ios      an iPhone or iPad: location is blocked in Settings or for this website
//   android  an Android phone: same, in Settings or Chrome's site settings
//   other    anything else (a computer, for example)

export type LocationHelpKind = "inApp" | "ios" | "android" | "other";

/**
 * Work out which help to show from the browser's "user agent" text (which
 * says what kind of browser and device it is) and whether the page was
 * opened from the home screen.
 */
export function locationHelpKind(userAgent: string, standalone = false): LocationHelpKind {
  const ios = /iPhone|iPad|iPod/.test(userAgent);
  const android = /Android/.test(userAgent);

  // Known apps that open links in their own mini browser.
  const inAppName =
    /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|BytedanceWebview|Twitter|GSA\//.test(
      userAgent,
    );
  // Android web views mark themselves with "; wv)".
  const androidWebView = android && /; wv\)/.test(userAgent);
  // iPhone browsers all say "Safari/" in their user agent; mini browsers inside apps don't.
  // (A page saved to the home screen also leaves it out, so it doesn't count.)
  const iosWebView = ios && !/Safari\//.test(userAgent) && !standalone;

  if (inAppName || androidWebView || iosWebView) return "inApp";
  if (ios) return "ios";
  if (android) return "android";
  return "other";
}
