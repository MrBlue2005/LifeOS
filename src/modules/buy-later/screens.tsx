import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfigurationRequired } from "@/core/components/configuration-required";
import { DueDecisionPanel, EarlyResolutionActions } from "./components/decision-panel";
import { DeleteBuyLaterItemForm } from "./components/delete-item-form";
import { ArrowIcon, BagIcon, ClockIcon, PauseIcon } from "./components/icons";
import { BuyLaterItemForm } from "./components/item-form";
import { formatCalendarDate, formatReconsiderationDistance, isBuyLaterItemDue, todayDateString } from "./domain/dates";
import { formatPrice } from "./domain/money";
import { normalizeProductUrl, productDomain } from "./domain/url";
import { getBuyLaterItem, listConsideringItems, listResolvedItems } from "./data/queries";
import { isUuid } from "./domain/validation";
import type { BuyLaterItem } from "./types";

function Notice({ value }: Readonly<{ value?: string }>) {
  const messages: Readonly<Record<string, string>> = {
    "item-created": "Saved for later.", "item-updated": "Changes saved.",
    "item-rescheduled": "A new reconsideration date is set.",
    "item-purchased": "Marked as purchased and moved to History.",
    "item-dismissed": "Decision saved and moved to History.",
    "item-deleted": "Item permanently deleted.",
  };
  return value && messages[value] ? <div className="notice" role="status"><span>{messages[value]}</span></div> : null;
}

function ItemCard({ item, today, history = false }: Readonly<{ item: BuyLaterItem; today: string; history?: boolean }>) {
  const due = isBuyLaterItemDue(item, today);
  const domain = item.productUrl ? productDomain(item.productUrl) : null;
  return <li className={`buy-later-item${due ? " buy-later-item-due" : ""}`}>
    <Link href={`/buy-later/items/${item.id}`}>
      <span className="buy-later-item-icon" aria-hidden="true">{due ? <ClockIcon /> : <BagIcon />}</span>
      <span className="buy-later-item-copy">
        <strong>{item.name}</strong>
        <span className="buy-later-card-timing">
          <span className={`status-pill status-${item.status}`}>{due ? "Due now" : item.status === "considering" ? `Reconsider ${formatReconsiderationDistance(item.reconsiderAt, today)}` : item.status === "purchased" ? "Purchased" : "Dismissed"}</span>
          {item.status === "considering" && !due ? <span>{formatCalendarDate(item.reconsiderAt)}</span> : null}
        </span>
        {item.currentPrice && item.currency || domain ? <span className="buy-later-card-supporting">{item.currentPrice && item.currency ? formatPrice(item.currentPrice, item.currency) : null}{item.currentPrice && item.currency && domain ? " · " : null}{domain}</span> : null}
        {history && item.resolvedAt ? <small>Decided {formatCalendarDate(item.resolvedAt.slice(0, 10))}</small> : <small>Saved {formatCalendarDate(item.createdAt.slice(0, 10))}</small>}
      </span>
      <ArrowIcon className="buy-later-arrow" />
    </Link>
  </li>;
}

export function BuyLaterConfigurationRequired() { return <ConfigurationRequired />; }

export async function BuyLaterHomeScreen({ userId, notice }: Readonly<{ userId: string; notice?: string }>) {
  const items = await listConsideringItems(userId);
  const today = todayDateString();
  const dueItems = items.filter((item) => isBuyLaterItemDue(item, today));
  const upcomingItems = items.filter((item) => !isBuyLaterItemDue(item, today));
  const hasItems = items.length > 0;
  return <div className={`buy-later-page buy-later-home${hasItems ? " has-items" : " is-empty"}`}>
    <header className="buy-later-hero">
      <div className="module-identity"><span className="module-identity-mark"><PauseIcon /></span><p><strong>Buy Later</strong></p></div>
      <div className="buy-later-heading-row"><div><h1>{hasItems ? "Buy with a clearer head." : "What are you thinking about buying?"}</h1><p>Save the thought now. Decide when the timing feels right.</p></div><Link className="primary-link" href="/buy-later/items/new">Save an item</Link></div>
    </header>
    <Notice value={notice} />
    {dueItems.length ? <section className="buy-later-section due-section" aria-labelledby="due-title">
      <div className="buy-later-section-heading"><div><p className="section-kicker">Reconsider</p><h2 id="due-title">Needs a decision</h2></div><span>{dueItems.length} due</span></div>
      <ul className="buy-later-list">{dueItems.map((item) => <ItemCard item={item} key={item.id} today={today} />)}</ul>
    </section> : hasItems ? <p className="buy-later-calm-status"><ClockIcon /><span><strong>Nothing needs a decision today.</strong> Your saved items are still waiting.</span></p> : null}
    {upcomingItems.length || !hasItems ? <section className="buy-later-section" aria-labelledby="considering-title">
      <div className="buy-later-section-heading"><div><p className="section-kicker">Waiting</p><h2 id="considering-title">Still considering</h2></div><Link className="secondary-link" href="/buy-later/history">History</Link></div>
      {upcomingItems.length ? <ul className="buy-later-list">{upcomingItems.map((item) => <ItemCard item={item} key={item.id} today={today} />)}</ul> : <div className="buy-later-empty"><PauseIcon /><div><strong>{hasItems ? "Everything active is ready to review." : "Give a purchase some breathing room."}</strong><p>{hasItems ? "The items above are waiting for your decision." : "Save something you may want, choose a reconsideration date, and come back with a clearer head."}</p></div>{!hasItems ? <Link className="primary-link" href="/buy-later/items/new">Save your first item</Link> : null}</div>}
    </section> : <nav className="buy-later-home-history" aria-label="Buy Later history"><Link className="secondary-link" href="/buy-later/history">History</Link></nav>}
  </div>;
}

export function NewBuyLaterItemScreen() {
  const today = todayDateString();
  return <div className="buy-later-page buy-later-narrow"><header className="module-heading buy-later-editor-heading"><div><div className="module-identity"><span className="module-identity-mark"><PauseIcon /></span><p><strong>Buy Later</strong></p></div><h1>Save it for later</h1><p className="heading-copy">Capture enough to recognize it, then choose when to reconsider.</p></div><Link className="secondary-link" href="/buy-later">Cancel</Link></header><section className="buy-later-editor-card"><BuyLaterItemForm today={today} /></section></div>;
}

export async function BuyLaterHistoryScreen({ userId }: Readonly<{ userId: string }>) {
  const items = await listResolvedItems(userId);
  const today = todayDateString();
  return <div className="buy-later-page buy-later-history"><header className="module-heading"><div><div className="module-identity"><span className="module-identity-mark"><BagIcon /></span><p><strong>Buy Later</strong></p></div><h1>Past decisions</h1><p className="heading-copy">A quiet record of what you bought and what you let go.</p></div><Link className="secondary-link" href="/buy-later">Back to Buy Later</Link></header>{items.length ? <ul className="buy-later-list">{items.map((item) => <ItemCard history item={item} key={item.id} today={today} />)}</ul> : <div className="buy-later-empty"><PauseIcon /><div><strong>No past decisions yet.</strong><p>Purchased and dismissed items will appear here.</p></div></div>}</div>;
}

export async function BuyLaterItemScreen({ userId, itemId, notice }: Readonly<{ userId: string; itemId: string; notice?: string }>) {
  if (!isUuid(itemId)) notFound();
  const item = await getBuyLaterItem(userId, itemId);
  if (!item) notFound();
  const today = todayDateString();
  const due = isBuyLaterItemDue(item, today);
  const safeUrl = item.productUrl ? normalizeProductUrl(item.productUrl) : null;
  return <div className="buy-later-page buy-later-narrow"><header className="module-heading buy-later-editor-heading"><div><div className="module-identity"><span className="module-identity-mark"><BagIcon /></span><p><strong>Buy Later</strong></p></div><h1>{item.name}</h1><p className="heading-copy">{item.status === "considering" ? due ? "This is ready for reconsideration." : `Reconsider ${formatReconsiderationDistance(item.reconsiderAt, today)}.` : item.status === "purchased" ? "Purchased — preserved in your history." : "Dismissed — preserved in your history."}</p>{safeUrl ? <a className="product-link" href={safeUrl} rel="noreferrer" target="_blank">Open {productDomain(safeUrl)} <span aria-hidden="true">↗</span></a> : null}</div><Link className="secondary-link" href={item.status === "considering" ? "/buy-later" : "/buy-later/history"}>Back</Link></header><Notice value={notice} />{item.status === "considering" ? due ? <DueDecisionPanel itemId={item.id} today={today} /> : <section className="waiting-panel" aria-labelledby="waiting-title"><div className="waiting-summary"><p className="section-kicker">Waiting</p><h2 id="waiting-title">Reconsider {formatReconsiderationDistance(item.reconsiderAt, today)}</h2><p className="waiting-date">{formatCalendarDate(item.reconsiderAt)}</p><p className="waiting-saved">Saved {formatCalendarDate(item.createdAt.slice(0, 10))}</p></div><EarlyResolutionActions itemId={item.id} /></section> : <section className={`resolved-panel resolved-${item.status}`}><p className="section-kicker">Decision saved</p><h2>{item.status === "purchased" ? "You bought this." : "You decided against this."}</h2><p>This record remains available in History.</p></section>}<section className="buy-later-editor-card" aria-labelledby="edit-buy-item"><h2 id="edit-buy-item">Item details</h2><BuyLaterItemForm item={item} today={today} /></section><DeleteBuyLaterItemForm itemId={item.id} itemName={item.name} /></div>;
}
