import "server-only";
import {readAdminStore,writeAdminStore} from "@/lib/admin-store";
import type {MyFatoorahWebhook} from "@/lib/payment-signatures";
import {trackMetaEvent} from "@/lib/meta";
export type {MyFatoorahWebhook} from "@/lib/payment-signatures";

export async function reconcileMyFatoorah(payload:MyFatoorahWebhook){
  const invoice=payload.Data?.Invoice;const transaction=payload.Data?.Transaction;const store=await readAdminStore();
  const orderId=invoice?.ExternalIdentifier||invoice?.MetaData?.orderId;const order=store.orders.find(item=>item.id===orderId);
  if(!order)return null;
  const paid=invoice?.Status==="PAID"&&transaction?.Status==="SUCCESS";
  if(paid){
    if(order.paymentStatus==="paid")return order;
    const orders=store.orders.map(item=>item.id===order.id?{...item,paymentStatus:"paid" as const,status:item.status==="pending"?"processing" as const:item.status}:item);
    const customers=store.customers.map(customer=>customer.email.toLowerCase()===order.email.toLowerCase()?{...customer,spent:customer.spent+order.total,lastOrderAt:new Date().toISOString()}:customer);
    const next=await writeAdminStore({...store,orders,customers},"MyFatoorah payment confirmed",order.number);
    await trackMetaEvent({eventId:`purchase-${order.id}`,name:'Purchase',productId:order.lines?.[0]?.productId,productName:order.lines?.[0]?.name,quantity:order.lines?.reduce((sum,line)=>sum+line.quantity,0),valueFils:order.total,email:order.email,phone:order.mobile}).catch(()=>undefined);
    return next.orders.find(item=>item.id===order.id)??null;
  }
  if(transaction?.Status&&transaction.Status!=="PENDING"&&!order.inventoryReleased){
    const products=store.products.map(product=>{const line=order.lines?.find(item=>item.productId===product.id);return line?{...product,stock:product.stock+line.quantity}:product});
    const orders=store.orders.map(item=>item.id===order.id?{...item,paymentStatus:"failed" as const,inventoryReleased:true}:item);
    await writeAdminStore({...store,products,orders},"MyFatoorah payment failed; inventory released",order.number);
  }
  return order;
}
