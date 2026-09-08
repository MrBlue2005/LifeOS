"use client";

import { useEffect, useState, useTransition } from "react";
import { disableBuyLaterRemindersAction, enableBuyLaterRemindersAction, updateBuyLaterNotificationPrivacyAction } from "../actions";
import { vapidPublicKeyToBytes } from "../domain/push-subscription";
import { detectPushSupport, type PushSupport } from "./push-support";

type ReminderStatus = "checking" | "unsupported" | "default" | "denied" | "disabled" | "enabled" | "stale" | "error";
type BrowserSubscription = PushSubscription & { toJSON(): { endpoint?: string; expirationTime?: number | null; keys?: Record<string, string> } };

function serialize(subscription: BrowserSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
    expirationTime: typeof subscription.expirationTime === "number" ? new Date(subscription.expirationTime).toISOString() : null,
  };
}

export function BuyLaterReminderSettings({
  pushEnabled, includeItemName, vapidPublicKey,
}: Readonly<{ pushEnabled: boolean; includeItemName: boolean; vapidPublicKey?: string }>) {
  const [status, setStatus] = useState<ReminderStatus>("checking");
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [privacy, setPrivacy] = useState(includeItemName);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void Promise.resolve().then(async () => {
      const current = detectPushSupport(window);
      setSupport(current);
      if (!current.supported) { setStatus("unsupported"); return; }
      if (Notification.permission === "denied") { setStatus("denied"); return; }
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      setStatus(pushEnabled && subscription ? "enabled" : pushEnabled ? "stale" : Notification.permission === "default" ? "default" : "disabled");
    }).catch(() => setStatus("error"));
  }, [pushEnabled]);

  function enable() {
    if (!support?.supported) return;
    if (!vapidPublicKey) { setStatus("error"); setMessage("Reminders are not configured for this environment."); return; }
    startTransition(() => { void (async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") { setStatus(permission === "denied" ? "denied" : "default"); setMessage("Notification permission was not granted."); return; }
        const registration = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
        const existing = await registration.pushManager.getSubscription();
        const subscription = (existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidPublicKeyToBytes(vapidPublicKey) })) as BrowserSubscription;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const result = await enableBuyLaterRemindersAction({ timezone, includeItemName: privacy, subscription: serialize(subscription) });
        if (!result.ok) { setStatus("error"); setMessage(result.message ?? "Could not enable reminders."); return; }
        setStatus("enabled"); setMessage("");
      } catch { setStatus("error"); setMessage("Could not enable reminders on this device. Try again."); }
    })(); });
  }

  function disable() {
    startTransition(() => { void (async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        const result = await disableBuyLaterRemindersAction(subscription?.endpoint ?? null);
        if (!result.ok) { setStatus("error"); setMessage(result.message ?? "Could not disable reminders."); return; }
        try { await subscription?.unsubscribe(); } catch { setMessage("Server reminders are disabled. Remove this browser permission in system settings if needed."); }
        setStatus("disabled");
      } catch { setStatus("error"); setMessage("Could not disable reminders. Try again."); }
    })(); });
  }

  function changePrivacy(checked: boolean) {
    setPrivacy(checked);
    if (status !== "enabled") return;
    startTransition(() => { void updateBuyLaterNotificationPrivacyAction(checked).then((result) => {
      if (!result.ok) { setPrivacy(!checked); setMessage(result.message ?? "Could not update notification privacy."); }
    }); });
  }

  const statusCopy: Record<ReminderStatus, string> = {
    checking: "Checking this browser…", unsupported: support?.standalone ? "Reminders are not supported in this web app." : "Reminders are unavailable here. On iPhone, open RX LifeOS from the Home Screen.",
    default: "Enable reminders when you want a nudge to reconsider.", denied: "Notifications are blocked. Allow them in your device settings to enable reminders.",
    disabled: "Reminders are off.", enabled: "Reminders are enabled on this device.", stale: "Reminders need to be enabled again on this device.", error: message || "Reminders need attention.",
  };
  const canEnable = status === "default" || status === "disabled" || status === "stale" || status === "error";

  return <section className="reminder-settings" aria-labelledby="reminder-settings-title">
    <div><p className="section-kicker">Reminders</p><h2 id="reminder-settings-title">Decide with a little space</h2><p>Remind me when items are ready to reconsider.</p></div>
    <p className="reminder-status" role="status">{statusCopy[status]}</p>
    {status === "enabled" ? <>
      <label className="reminder-privacy"><input checked={privacy} disabled={pending} onChange={(event) => changePrivacy(event.target.checked)} type="checkbox" /> <span><strong>Show item names in notifications</strong><small>Item names may be visible on your lock screen.</small></span></label>
      <button className="secondary-button" disabled={pending} onClick={disable} type="button">{pending ? "Updating…" : "Disable reminders"}</button>
    </> : canEnable ? <button className="primary-button" disabled={pending || !support?.supported} onClick={enable} type="button">{pending ? "Enabling…" : "Enable reminders"}</button> : null}
  </section>;
}
