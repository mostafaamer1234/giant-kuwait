import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {AdminDetailFrame,adminMoney} from "@/components/AdminDetailFrame";
import {getAdminSession} from "@/lib/admin-auth";
import {readAdminStore} from "@/lib/admin-store";

export const dynamic="force-dynamic";
export default async function CustomerDetails({params}:{params:Promise<{id:string}>}) {
  if(!await getAdminSession()) redirect("/admin/login");
  const {id}=await params;
  const store=await readAdminStore();
  const customer=store.customers.find(item=>item.id===id);
  if(!customer) notFound();
  const orders=store.orders.filter(order=>order.email.toLowerCase()===customer.email.toLowerCase()||order.customer.toLowerCase()===customer.name.toLowerCase()).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  const orderCount=Math.max(customer.orders,orders.length);
  const average=orderCount?Math.round(customer.spent/orderCount):0;
  return <AdminDetailFrame section="Customers" title={customer.name} eyebrow="CUSTOMER PROFILE">
    <div className="detail-stat-grid">
      <article><small>LIFETIME SPEND</small><strong>{adminMoney(customer.spent)}</strong><span>Recorded revenue</span></article>
      <article><small>ORDERS</small><strong>{orderCount}</strong><span>{orders.length} linked in store</span></article>
      <article><small>AVERAGE ORDER</small><strong>{adminMoney(average)}</strong><span>Lifetime average</span></article>
      <article><small>LAST ORDER</small><strong>{orders[0]?new Date(orders[0].createdAt).toLocaleDateString("en-KW"):"—"}</strong><span>{orders[0]?.number??"No linked order"}</span></article>
    </div>
    <div className="detail-layout">
      <section className="detail-card detail-main" id="orders"><div className="detail-card-title"><h2>ORDER HISTORY</h2><span>{orders.length} LINKED</span></div>
        {orders.length?orders.map(order=><Link className="detail-order-row" href={`/admin/orders/${order.id}`} key={order.id}><div><b>{order.number}</b><small>{new Date(order.createdAt).toLocaleDateString("en-KW")}</small></div><span className="detail-status">{order.status}</span><strong>{adminMoney(order.total)}</strong><i>VIEW →</i></Link>):<div className="detail-empty"><b>No linked order records</b><p>The imported profile reports {customer.orders} historical orders, but their individual records are not present in this store.</p></div>}
      </section>
      <aside className="detail-side">
        <section className="detail-card"><h2>CONTACT</h2><b>{customer.name}</b><a href={`mailto:${customer.email}`}>{customer.email}</a>{customer.mobile?<a href={`tel:${customer.mobile}`}>{customer.mobile}</a>:<span className="muted">No mobile number</span>}</section>
        <section className="detail-card"><h2>PROFILE</h2><dl className="detail-list"><div><dt>Customer ID</dt><dd>{customer.id}</dd></div><div><dt>Member since</dt><dd>{customer.createdAt?new Date(customer.createdAt).toLocaleDateString("en-KW"):"Imported profile"}</dd></div><div><dt>Tags</dt><dd>{customer.tags?.join(", ")||"—"}</dd></div></dl></section>
      </aside>
    </div>
  </AdminDetailFrame>;
}
