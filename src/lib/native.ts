/**
 * True inside the Origina Android app (its WebView adds "OriginaApp" to the
 * user agent, see mobile/capacitor.config.json). Google Play doesn't allow
 * in-app links to pay outside Google Play, so purchase screens are hidden there.
 */
export function isNativeApp(): boolean {
  return typeof navigator !== "undefined" && /\bOriginaApp\b/.test(navigator.userAgent);
}
