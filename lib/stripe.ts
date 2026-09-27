import "server-only";
import Stripe from "stripe";
import {readAdminStore,writeAdminStore,type AdminOrder} from "@/lib/admin-store";
import {trackMetaEvent} from "@/lib/meta";

export function getStripe(){const key=process.env.STRIPE_SECRET_KEY;if(!key)throw new Error("STRIPE_NOT_CONFIGURED");return new Stripe(key);}

export async function getStripeAccountStatus(){
  const key=process.env.STRIPE_SECRET_KEY;
  if(!key)return {configured:false,mode:null,account:null,error:null};
  try{const account=await getStripe().accounts.retrieve(null);return {configured:true,mode:key.startsWith("sk_live_")?"live":"test",account:{id:account.id,country:account.country,email:account.email??null,businessName:account.business_profile?.name??account.settings?.dashboard?.display_name??null,chargesEnabled:account.charges_enabled,payoutsEnabled:account.payouts_enabled,detailsSubmitted:account.details_submitted},error:null};}
  catch(error){return {configured:true,mode:key.startsWith("sk_live_")?"live":"test",account:null,error:error instanceof Error?error.message:"Stripe connection failed"};}
}

function findOrder(orders:AdminOrder[],session:Stripe.Checkout.Session){return orders.find(order=>order.id===session.metadata?.orderId||order.stripeSessionId===session.id)}

export async function reconcileStripeSession(session:Stripe.Checkout.Session,eventType:string){
  const store=await readAdminStore();const order=findOrder(store.orders,session);if(!order)return null;
  if((eventType==="checkout.session.completed"||eventType==="checkout.session.async_payment_succeeded")&&session.payment_status!=="unpaid"){
    if(order.paymentStatus==="paid")return order;
    const paidTotal=session.amount_total??order.total;const discount=Math.max(0,order.total-paidTotal);
    const orders=store.orders.map(item=>item.id===order.id?{...item,total:paidTotal,discount,paymentStatus:"paid" as const,status:item.status==="pending"?"processing" as const:item.status}:item);
    const customers=store.customers.map(customer=>customer.email.toLowerCase()===order.email.toLowerCase()?{...customer,spent:customer.spent+paidTotal,lastOrderAt:new Date().toISOString()}:customer);
    const next=await writeAdminStore({...store,orders,customers},`Stripe payment confirmed (${eventType})`,order.number);await trackMetaEvent({eventId:`purchase-${order.id}`,name:'Purchase',productId:order.lines?.[0]?.productId,productName:order.lines?.[0]?.name,quantity:order.lines?.reduce((sum,line)=>sum+line.quantity,0),valueFils:paidTotal,email:order.email,phone:order.mobile}).catch(()=>undefined);return next.orders.find(item=>item.id===order.id)??null;
  }
  if(eventType==="checkout.session.expired"||eventType==="checkout.session.async_payment_failed"){
    if(order.paymentStatus==="paid"||order.inventoryReleased)return order;
    const products=store.products.map(product=>{const line=order.lines?.find(item=>item.productId===product.id);return line?{...product,stock:product.stock+line.quantity}:product});
    const orders=store.orders.map(item=>item.id===order.id?{...item,paymentStatus:"failed" as const,inventoryReleased:true}:item);
    const next=await writeAdminStore({...store,products,orders},`Stripe inventory released (${eventType})`,order.number);return next.orders.find(item=>item.id===order.id)??null;
  }
  return order;
}
