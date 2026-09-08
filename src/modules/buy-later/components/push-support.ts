export type PushSupport = Readonly<{ supported: boolean; standalone: boolean }>;

type PushBrowser = Readonly<{
  isSecureContext: boolean;
  matchMedia: Window["matchMedia"];
  Notification: typeof Notification;
  PushManager?: unknown;
  navigator: Pick<Navigator, "serviceWorker"> & { standalone?: boolean };
}>;

export function detectPushSupport(browser: PushBrowser): PushSupport {
  const standalone = browser.matchMedia("(display-mode: standalone)").matches || ("standalone" in browser.navigator && (browser.navigator as Navigator & { standalone?: boolean }).standalone === true);
  return { standalone, supported: browser.isSecureContext && "serviceWorker" in browser.navigator && typeof browser.PushManager !== "undefined" && typeof browser.Notification !== "undefined" };
}
