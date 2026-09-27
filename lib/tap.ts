import 'server-only';
import {readAdminStore,writeAdminStore} from '@/lib/admin-store';
import {trackMetaEvent} from '@/lib/meta';

export type TapCharge={id:string;status:string;amount?:number;currency?:string;reference?:{transaction?:string;order?:string};metadata?:{orderId?:string};transaction?:{url?:string}};

export async function getTapCharge(chargeId:string){
  const secret=process.env.TAP_SECRET_KEY;if(!secret)throw new Error('TAP_NOT_CONFIGURED');
  const response=await fetch(`https://api.tap.company/v2/charges/${encodeURIComponent(chargeId)}`,{headers:{Authorization:`Bearer ${secret}`},cache:'no-store'});
  if(!response.ok)throw new Error(`Tap charge lookup failed (${response.status})`);
  return await response.json() as TapCharge;
}

export async function reconcileTapCharge(charge:TapCharge){
  const store=await readAdminStore();const orderId=charge.metadata?.orderId||charge.reference?.transaction;
  const order=store.orders.find(item=>item.id===orderId||item.tapChargeId===charge.id);if(!order)return null;
  if(charge.status==='CAPTURED'){
    if(order.paymentStatus==='paid')return order;
    const paidTotal=charge.amount!=null?Math.round(charge.amount*1000):order.total;
    const orders=store.orders.map(item=>item.id===order.id?{...item,total:paidTotal,paymentStatus:'paid' as const,status:item.status==='pending'?'processing' as const:item.status}:item);
    const customers=store.customers.map(customer=>customer.email.toLowerCase()===order.email.toLowerCase()?{...customer,spent:customer.spent+paidTotal,lastOrderAt:new Date().toISOString()}:customer);
    const next=await writeAdminStore({...store,orders,customers},'Tap payment confirmed',order.number);
    await trackMetaEvent({eventId:`purchase-${order.id}`,name:'Purchase',productId:order.lines?.[0]?.productId,productName:order.lines?.[0]?.name,quantity:order.lines?.reduce((sum,line)=>sum+line.quantity,0),valueFils:paidTotal,email:order.email,phone:order.mobile}).catch(()=>undefined);
    return next.orders.find(item=>item.id===order.id)??null;
  }
  const failed=['FAILED','DECLINED','CANCELLED','ABANDONED','RESTRICTED','VOID'].includes(charge.status);
  if(failed&&order.paymentStatus!=='paid'&&!order.inventoryReleased){
    const products=store.products.map(product=>{const line=order.lines?.find(item=>item.productId===product.id);return line?{...product,stock:product.stock+line.quantity}:product});
    const orders=store.orders.map(item=>item.id===order.id?{...item,paymentStatus:'failed' as const,inventoryReleased:true}:item);
    const next=await writeAdminStore({...store,products,orders},`Tap payment ${charge.status.toLowerCase()}; inventory released`,order.number);
    return next.orders.find(item=>item.id===order.id)??null;
  }
  return order;
}
