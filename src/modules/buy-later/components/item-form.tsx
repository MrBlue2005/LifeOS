"use client";

import { useActionState, useState } from "react";
import { createBuyLaterItemAction, updateBuyLaterItemAction } from "../actions";
import { reconsiderationPresets } from "../domain/dates";
import { initialBuyLaterActionState, type BuyLaterItem } from "../types";
import { ReconsiderationDateControl } from "./date-preset-buttons";
import { BuyLaterSubmitButton } from "./form-controls";

function FieldError({ id, message }: Readonly<{ id: string; message?: string }>) {
  return message ? <p className="field-error" id={id} role="alert">{message}</p> : null;
}

type InitialValues = Readonly<{ name?: string; productUrl?: string; note?: string }>;

export function BuyLaterItemForm({ item, today, initialValues }: Readonly<{ item?: BuyLaterItem; today: string; initialValues?: InitialValues }>) {
  const action = item ? updateBuyLaterItemAction : createBuyLaterItemAction;
  const [state, formAction] = useActionState(action, initialBuyLaterActionState);
  const presets = reconsiderationPresets(today);
  const initialDate = state.values.reconsiderAt ?? item?.reconsiderAt ?? presets[2].value;
  const [reconsiderAt, setReconsiderAt] = useState(initialDate);

  return (
    <form className="buy-later-form" action={formAction} noValidate>
      {item ? <input name="itemId" type="hidden" value={item.id} /> : null}
      <label className="field buy-later-name-field">
        <span>What is it?</span>
        <input aria-describedby={state.fields.name ? "buy-name-error" : undefined} aria-invalid={Boolean(state.fields.name)} autoFocus={!item} defaultValue={state.values.name ?? item?.name ?? initialValues?.name ?? ""} maxLength={160} name="name" placeholder="Noise-cancelling headphones" required />
        <FieldError id="buy-name-error" message={state.fields.name} />
      </label>

      <label className="field">
        <span>Product link <small>Optional</small></span>
        <input aria-describedby={state.fields.productUrl ? "buy-url-error" : "buy-url-hint"} aria-invalid={Boolean(state.fields.productUrl)} autoCapitalize="none" autoComplete="url" defaultValue={state.values.productUrl ?? item?.productUrl ?? initialValues?.productUrl ?? ""} inputMode="url" maxLength={2048} name="productUrl" placeholder="https://store.example/product" type="url" />
        <span className="form-hint" id="buy-url-hint">Product links are optional. RX LifeOS does not monitor them or track prices.</span>
        <FieldError id="buy-url-error" message={state.fields.productUrl} />
      </label>

      <div className="buy-later-price-row">
        <label className="field">
          <span>Current price <small>Optional</small></span>
          <input aria-describedby={state.fields.currentPrice ? "buy-price-error" : undefined} aria-invalid={Boolean(state.fields.currentPrice)} defaultValue={state.values.currentPrice ?? item?.currentPrice ?? ""} inputMode="decimal" name="currentPrice" placeholder="499.99" />
          <FieldError id="buy-price-error" message={state.fields.currentPrice} />
        </label>
        <label className="field">
          <span>Currency</span>
          <input aria-describedby={state.fields.currency ? "buy-currency-error" : undefined} aria-invalid={Boolean(state.fields.currency)} autoCapitalize="characters" defaultValue={state.values.currency ?? item?.currency ?? ""} maxLength={3} name="currency" placeholder="RON" />
          <FieldError id="buy-currency-error" message={state.fields.currency} />
        </label>
      </div>

      <fieldset className="reconsideration-fieldset">
        <legend>When should you reconsider it?</legend>
        <p>This is when RX LifeOS will ask whether you still want it.</p>
        <ReconsiderationDateControl
          describedBy={state.fields.reconsiderAt ? "buy-date-error" : undefined}
          invalid={Boolean(state.fields.reconsiderAt)}
          label="Custom date"
          min={item ? undefined : today}
          onChange={setReconsiderAt}
          presets={presets}
          presetsFirst
          value={reconsiderAt}
        />
        <FieldError id="buy-date-error" message={state.fields.reconsiderAt} />
      </fieldset>

      <label className="field">
        <span>Note <small>Optional</small></span>
        <textarea aria-describedby={state.fields.note ? "buy-note-error" : undefined} aria-invalid={Boolean(state.fields.note)} defaultValue={state.values.note ?? item?.note ?? initialValues?.note ?? ""} maxLength={1000} name="note" placeholder="What makes this worth considering?" />
        <FieldError id="buy-note-error" message={state.fields.note} />
      </label>

      {state.message && !Object.keys(state.fields).length ? <p className="form-error" role="alert">{state.message}</p> : null}
      <BuyLaterSubmitButton label={item ? "Save changes" : "Save for later"} pendingLabel="Saving…" />
    </form>
  );
}
