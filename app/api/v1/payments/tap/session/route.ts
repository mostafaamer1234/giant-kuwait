import {NextRequest,NextResponse} from 'next/server';
import {checkoutOrderSchema} from '@/lib/checkout-schema';
import {nextOrderNumber,readAdminStore,writeAdminStore,type AdminOrderLine} from '@/lib/admin-store';
import {findEligiblePromotion,pricePromotion} from '@/lib/promotions';
import {bundleForQuantity,productLineTotal} from '@/lib/catalog';
import type {TapCharge} from '@/lib/tap';

export const runtime='nodejs';
export async function POST(request:NextRequest){
  const parsed=checkoutOrderSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success||parsed.data.payment!=='tap')return NextResponse.json({code:'INVALID_ORDER',message:'Please complete every required checkout field.'},{status:400});
  const input=parsed.data;const secret=process.env.TAP_SECRET_KEY;const merchantId=process.env.TAP_MERCHANT_ID;
  if(!secret||!merchantId)return NextResponse.json({code:'TAP_NOT_CONFIGURED',message:'Tap Payments is awaiting merchant credentials.'},{status:503});
  const store=await readAdminStore();if(!store.settings.tapEnabled)return NextResponse.json({code:'TAP_DISABLED',message:'Tap Payments is currently unavailable.'},{status:409});
  if(input.idempotencyKey){const existing=store.orders.find(order=>order.idempotencyKey===input.idempotencyKey&&order.tapChargeId);if(existing?.tapCheckoutUrl)return NextResponse.json({data:{number:existing.number,url:existing.tapCheckoutUrl,chargeId:existing.tapChargeId}})}
  let subtotal=0;const lines:AdminOrderLine[]=[];
  for(const line of input.lines){const product=store.products.find(item=>item.id===line.id&&item.status==='published');if(!product)return NextResponse.json({code:'PRODUCT_UNAVAILABLE',message:'A product in your bag is unavailable.'},{status:409});if(product.stock<line.qty)return NextResponse.json({code:'OUT_OF_STOCK',message:`Only ${product.stock} units of ${product.name} remain.`},{status:409});const lineTotal=productLineTotal(product,line.qty);const bundle=bundleForQuantity(product,line.qty);subtotal+=lineTotal;lines.push({productId:product.id,name:product.name,sku:product.id,size:line.size,color:product.color,quantity:line.qty,unitPrice:product.price,lineTotal,bundleLabel:bundle?.label,unitCost:product.cost,image:product.image})}
  const baseDelivery=subtotal>=store.settings.freeShippingFils?0:store.settings.standardDeliveryFils;const promotion=findEligiblePromotion(store,input.promotionCode,subtotal);const priced=pricePromotion(promotion,subtotal,baseDelivery);const total=subtotal-priced.discount+priced.delivery;
  const createdAt=new Date().toISOString();const id=crypto.randomUUID();const number=nextOrderNumber(store.orders,createdAt);const origin=process.env.PUBLIC_SITE_ORIGIN||request.nextUrl.origin;
  const digits=input.mobile.replace(/\D/g,'');const localNumber=digits.startsWith('965')?digits.slice(3):digits;
  const provider=await fetch('https://api.tap.company/v2/charges/',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({amount:total/1000,currency:'KWD',customer_initiated:true,threeDSecure:true,save_card:false,description:`GIANT order ${number}`,metadata:{orderId:id,orderNumber:number},reference:{transaction:id,order:number},receipt:{email:true,sms:false},customer:{first_name:input.firstName,last_name:input.lastName,email:input.email,phone:{country_code:'965',number:localNumber}},merchant:{id:merchantId},source:{id:'src_all'},post:{url:`${origin}/api/v1/webhooks/tap`},redirect:{url:`${origin}/${input.locale}/checkout/tap/result`}})});
  const charge=await provider.json().catch(()=>null) as (TapCharge&{errors?:Array<{description?:string}>})|null;const url=charge?.transaction?.url;
  if(!provider.ok||!charge?.id||!url)return NextResponse.json({code:'TAP_ERROR',message:charge?.errors?.[0]?.description||'Tap could not create a payment session.'},{status:502});
  const order={id,number,customer:`${input.firstName} ${input.lastName}`,email:input.email,mobile:input.mobile,total,subtotal,delivery:priced.delivery,discount:priced.discount,promotionId:priced.promotionId,promotionCode:priced.promotionCode,payment:'tap' as const,paymentStatus:'pending' as const,status:'pending' as const,createdAt,address:{area:input.area,block:input.block,street:input.street,building:input.building,floor:input.floor},lines,tapChargeId:charge.id,tapCheckoutUrl:url,idempotencyKey:input.idempotencyKey,inventoryReleased:false};
  const products=store.products.map(product=>{const line=lines.find(item=>item.productId===product.id);return line?{...product,stock:product.stock-line.quantity}:product});const promotions=promotion?store.promotions.map(item=>item.id===promotion.id?{...item,uses:(item.uses??0)+1}:item):store.promotions;const existing=store.customers.find(customer=>customer.email.toLowerCase()===input.email.toLowerCase());const customers=existing?store.customers.map(customer=>customer.id===existing.id?{...customer,name:order.customer,mobile:input.mobile,orders:customer.orders+1,lastOrderAt:createdAt}:customer):[{id:crypto.randomUUID(),name:order.customer,email:input.email,mobile:input.mobile,orders:1,spent:0,createdAt,lastOrderAt:createdAt,tags:['Tap customer']},...store.customers];
  await writeAdminStore({...store,products,promotions,customers,orders:[order,...store.orders]},'Created Tap payment session',number);
  return NextResponse.json({data:{number,url,chargeId:charge.id}});
}
