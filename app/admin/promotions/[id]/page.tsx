import {notFound,redirect} from "next/navigation";
import {AdminDetailFrame,adminMoney} from "@/components/AdminDetailFrame";
import {getAdminSession} from "@/lib/admin-auth";
import {readAdminStore} from "@/lib/admin-store";
import {promotionMetrics} from "@/lib/commerce-analytics";

export const dynamic="force-dynamic";
export default async function PromotionDetails({params}:{params:Promise<{id:string}>}) {
  if(!await getAdminSession()) redirect("/admin/login");
  const {id}=await params;
  const store=await readAdminStore();
  const promotion=store.promotions.find(item=>item.id===id);
  if(!promotion) notFound();
  const metrics=promotionMetrics(promotion,store.orders,store.products);
  return <AdminDetailFrame section="Promotions" title={promotion.name} eyebrow="PROMOTION DETAILS">
    <div className="detail-stat-grid">
      <article><small>STATUS</small><strong className="detail-status">{promotion.active?"Active":"Paused"}</strong><span>Campaign availability</span></article>
      <article><small>DISCOUNT</small><strong>{promotion.discount?`${promotion.discount}%`:"FREE SHIP"}</strong><span>{promotion.scope??"Storewide"}</span></article>
      <article><small>LINK CLICKS</small><strong>{metrics.clicks}</strong><span>Tracked campaign visits</span></article>
      <article><small>PURCHASES</small><strong>{metrics.purchases}</strong><span>{(metrics.conversionRate*100).toFixed(1)}% conversion rate</span></article>
      <article><small>NET SALES</small><strong>{adminMoney(metrics.netSales)}</strong><span>{adminMoney(metrics.averageOrderValue)} average order</span></article>
      <article><small>PROFIT</small><strong>{adminMoney(metrics.profit)}</strong><span>Net sales minus item cost</span></article>
      <article><small>GROSS SALES</small><strong>{adminMoney(metrics.grossSales)}</strong><span>Before promotion discount</span></article>
      <article><small>DISCOUNTS</small><strong>{adminMoney(metrics.discounts)}</strong><span>Promotion value given</span></article>
      <article><small>ITEMS SOLD</small><strong>{metrics.items}</strong><span>Attributed units</span></article>
      <article><small>EXCEPTIONS</small><strong>{metrics.refunds+metrics.cancellations}</strong><span>{metrics.refunds} refunds · {metrics.cancellations} failed/cancelled</span></article>
    </div>
    <div className="detail-layout">
      <section className="detail-card detail-main"><div className="promotion-hero"><small>DISCOUNT CODE</small><strong>{promotion.code||"AUTOMATIC"}</strong><p>{promotion.description||"A GIANT storefront promotion managed from the operations dashboard."}</p></div><h2>ATTRIBUTED ORDERS</h2>{metrics.orders.length?metrics.orders.map(order=><a className="detail-order-row" href={`/admin/orders/${order.id}`} key={order.id}><div><b>{order.number}</b><small>{order.customer}</small></div><span>{new Date(order.createdAt).toLocaleDateString('en-KW')}</span><b>{adminMoney(order.total)}</b><i>{order.status}</i></a>):<p className="detail-empty">No purchases have been attributed yet.</p>}</section>
      <aside className="detail-side"><section className="detail-card"><h2>CAMPAIGN LINK</h2><code>/?promo={promotion.code}</code><span className="muted">Clicks are counted once per browser session and connected to checkout purchases.</span></section><section className="detail-card"><h2>RULES</h2><dl className="detail-list"><div><dt>Applies to</dt><dd>{promotion.scope??"All eligible products"}</dd></div><div><dt>Starts</dt><dd>{promotion.startAt?new Date(promotion.startAt).toLocaleString("en-KW"):"Immediately"}</dd></div><div><dt>Ends</dt><dd>{promotion.endAt?new Date(promotion.endAt).toLocaleString("en-KW"):"No end date"}</dd></div><div><dt>Limit</dt><dd>{promotion.usageLimit??"Unlimited"}</dd></div><div><dt>Minimum</dt><dd>{adminMoney(promotion.minimumSpendFils??0)}</dd></div></dl></section></aside>
    </div>
  </AdminDetailFrame>;
}
