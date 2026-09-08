"use client";

import { useActionState, useState } from "react";
import { rescheduleBuyLaterItemAction, resolveBuyLaterItemAction } from "../actions";
import { reconsiderationPresets } from "../domain/dates";
import { initialBuyLaterActionState } from "../types";
import { ReconsiderationDateControl } from "./date-preset-buttons";
import { BuyLaterFeedback, BuyLaterSubmitButton } from "./form-controls";

export function DueDecisionPanel({ itemId, today }: Readonly<{ itemId: string; today: string }>) {
  const presets = reconsiderationPresets(today);
  const [date, setDate] = useState(presets[2].value);
  const [rescheduleState, rescheduleAction] = useActionState(rescheduleBuyLaterItemAction, initialBuyLaterActionState);
  const [resolveState, resolveAction] = useActionState(resolveBuyLaterItemAction, initialBuyLaterActionState);

  return (
    <section className="decision-panel decision-panel-due" aria-labelledby="decision-title">
      <p className="section-kicker">Reconsider</p>
      <h2 id="decision-title">Do you still want this?</h2>
      <p className="decision-copy">You saved this to give the decision some time.</p>

      <form action={rescheduleAction} className="decision-reschedule">
        <input name="itemId" type="hidden" value={itemId} />
        <div className="decision-option-heading">
          <strong>Keep considering it</strong>
          <span>Choose when you want to look at this again.</span>
        </div>
        <ReconsiderationDateControl
          compact
          label="Ask me again on"
          min={presets[0].value}
          onChange={setDate}
          presets={presets}
          value={date}
        />
        <BuyLaterSubmitButton label="I still want it" pendingLabel="Rescheduling…" />
        <BuyLaterFeedback state={rescheduleState} />
      </form>

      <div className="decision-final-actions">
        <p>Or close the decision now</p>
        <form action={resolveAction}><input name="itemId" type="hidden" value={itemId} /><input name="outcome" type="hidden" value="purchased" /><BuyLaterSubmitButton label="I bought it" pendingLabel="Saving…" tone="secondary" /></form>
        <form action={resolveAction}><input name="itemId" type="hidden" value={itemId} /><input name="outcome" type="hidden" value="dismissed" /><BuyLaterSubmitButton label="I don’t want it anymore" pendingLabel="Saving…" tone="secondary" /></form>
      </div>
      <BuyLaterFeedback state={resolveState} />
    </section>
  );
}

export function EarlyResolutionActions({ itemId }: Readonly<{ itemId: string }>) {
  const [resolveState, resolveAction] = useActionState(resolveBuyLaterItemAction, initialBuyLaterActionState);

  return (
    <section className="early-resolution-actions" aria-labelledby="early-decision-title">
      <p className="section-kicker">Already decided?</p>
      <h2 id="early-decision-title">Record what happened</h2>
      <p>You can keep waiting, or save a final decision early.</p>
      <div className="decision-final-actions">
        <form action={resolveAction}><input name="itemId" type="hidden" value={itemId} /><input name="outcome" type="hidden" value="purchased" /><BuyLaterSubmitButton label="Mark as purchased" pendingLabel="Saving…" tone="secondary" /></form>
        <form action={resolveAction}><input name="itemId" type="hidden" value={itemId} /><input name="outcome" type="hidden" value="dismissed" /><BuyLaterSubmitButton label="I don’t want this anymore" pendingLabel="Saving…" tone="secondary" /></form>
      </div>
      <BuyLaterFeedback state={resolveState} />
    </section>
  );
}
