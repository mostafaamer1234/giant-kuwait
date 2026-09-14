import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {AdminDetailFrame,adminMoney} from "@/components/AdminDetailFrame";
import {getAdminSession} from "@/lib/admin-auth";
import {readAdminStore} from "@/lib/admin-store";

export const dynamic="force-dynamic";
export default async function OrderDetails({params}:{params:Promise<{id:string}>}) {
  if(!await getAdminSession()) redirect("/admin/login");
  const {id}=await params;
  const store=await readAdminStore();
  const order=store.orders.find(item=>item.id===id);
  if(!order) notFound();
  const customer=store.customers.find(item=>item.email.toLowerCase()===order.email.toLowerCase()||item.name.toLowerCase()===order.customer.toLowerCase());
  return <AdminDetailFrame section="Orders" title={order.number} eyebrow="ORDER DETAILS">
    <div className="order-receipt-action"><a href={`/api/v1/admin/receipts/pdf?orderId=${order.id}`} target="_blank" rel="noreferrer">PRINT RECEIPT ↗</a></div>
    <div className="detail-stat-grid">
      <article><small>TOTAL</small><strong>{adminMoney(order.total)}</strong><span>{order.lines?.reduce((sum,line)=>sum+line.quantity,0)??"—"} items</span></article>
      <article><small>ORDER STATUS</small><strong className="detail-status">{order.status}</strong><span>Fulfillment state</span></article>
      <article><small>PAYMENT</small><strong>{order.payment?.toUpperCase()??"LEGACY"}</strong><span>{order.paymentStatus??"Not captured"}</span></article>
      <article><small>PLACED</small><strong>{new Date(order.createdAt).toLocaleDateString("en-KW")}</strong><span>{new Date(order.createdAt).toLocaleTimeString("en-KW",{hour:"2-digit",minute:"2-digit"})}</span></article>
    </div>
    <div className="detail-layout">
      <section className="detail-card detail-main"><div className="detail-card-title"><h2>ITEMS</h2><span>{order.lines?.length??0} LINE ITEMS</span></div>
        {order.lines?.length?order.lines.map(line=><div className="detail-line" key={`${line.productId}-${line.size??"default"}`}>
          <i style={{backgroundImage:line.image?`url(${line.image})`:undefined}} />
          <div><b>{line.name}</b><small>{line.color}{line.size?` · ${line.size}`:""} · SKU {line.sku}</small></div>
          <span>QTY {line.quantity}</span><strong>{adminMoney(line.unitPrice*line.quantity)}</strong>
        </div>):<div className="detail-empty"><b>Legacy order</b><p>This order predates line-item capture. Customer, total, status and timestamp remain available.</p></div>}
        <div className="detail-totals"><span>Subtotal <b>{adminMoney(order.subtotal??order.total-(order.delivery??0))}</b></span><span>Delivery <b>{adminMoney(order.delivery??0)}</b></span>{Boolean(order.discount)&&<span>Discount <b>−{adminMoney(order.discount??0)}</b></span>}<strong>Total <b>{adminMoney(order.total)}</b></strong></div>
      </section>
      <aside className="detail-side">
        <section className="detail-card"><h2>CUSTOMER</h2>{customer?<Link className="detail-person-link" href={`/admin/customers/${customer.id}`}><b>{order.customer}</b><span>VIEW PROFILE →</span></Link>:<b>{order.customer}</b>}<a href={`mailto:${order.email}`}>{order.email}</a>{order.mobile&&<a href={`tel:${order.mobile}`}>{order.mobile}</a>}</section>
        <section className="detail-card"><h2>DELIVERY ADDRESS</h2>{order.address?<address>Area {order.address.area}<br/>Block {order.address.block}, Street {order.address.street}<br/>Building {order.address.building}{order.address.floor?`, Floor ${order.address.floor}`:""}<br/>Kuwait</address>:<p className="muted">Address was not captured for this legacy order.</p>}</section>
        <section className="detail-card"><h2>ORDER TIMELINE</h2><ol className="detail-timeline"><li><b>Order placed</b><span>{new Date(order.createdAt).toLocaleString("en-KW")}</span></li><li className="active"><b>{order.status}</b><span>Current state</span></li></ol></section>
      </aside>
    </div>
  </AdminDetailFrame>;
}
