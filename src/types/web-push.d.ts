declare module "web-push" {
  type PushSubscription = {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  type SendOptions = {
    vapidDetails: { subject: string; publicKey: string; privateKey: string };
    TTL?: number;
    urgency?: "very-low" | "low" | "normal" | "high";
  };

  type PushResponse = { statusCode?: number };

  const webPush: {
    sendNotification(subscription: PushSubscription, payload?: string, options?: SendOptions): Promise<PushResponse>;
  };

  export default webPush;
}
