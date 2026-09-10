import { getBuyLaterReminderSchedulerConfig, isAuthorizedBuyLaterReminderSchedulerRequest } from "@/core/config/buy-later-reminder-scheduler.server";
import { runBuyLaterDueReminderScheduler } from "@/modules/buy-later/notifications/scheduler.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const config = getBuyLaterReminderSchedulerConfig();
    if (!config || !isAuthorizedBuyLaterReminderSchedulerRequest(request.headers.get("authorization"), config.secret)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await runBuyLaterDueReminderScheduler({ rolloutDate: config.rolloutDate });
    return Response.json(result);
  } catch {
    return Response.json({ error: "Reminder scheduler unavailable" }, { status: 503 });
  }
}
