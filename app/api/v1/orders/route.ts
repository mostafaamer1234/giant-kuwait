import {NextRequest,NextResponse} from 'next/server';
import {checkoutOrderSchema} from '@/lib/checkout-schema';
import {nextOrderNumber,readAdminStore,writeAdminStore,type AdminOrderLine} from '@/lib/admin-store';
import {findEligiblePromotion,pricePromotion} from '@/lib/promotions';

export const runtime='nodejs';
export async function POST(request:NextRequest){
  const parsed=checkoutOrderSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({code:'INVALID_ORDER',message:'Please complete every required checkout field.'},{status:400});
  const input=parsed.data;
  if(input.payment==='stripe')return NextResponse.json({code:'USE_STRIPE_SESSION',message:'Stripe orders must use the secure Stripe session endpoint.'},{status:400});
  const store=await readAdminStore();
  if(input.payment==='cod'&&!store.settings.codEnabled)return NextResponse.json({code:'PAYMENT_DISABLED',message:'Cash on delivery is currently unavailable.'},{status:409});
  if(input.payment==='knet'&&!store.settings.myFatoorahEnabled)return NextResponse.json({code:'PAYMENT_DISABLED',message:'MyFatoorah is currently unavailable.'},{status:409});
  let subtotal=0;const orderLines:AdminOrderLine[]=[];
  for(const line of input.lines){const product=store.products.find(item=>item.id===line.id&&item.status==='published');if(!product)return NextResponse.json({code:'PRODUCT_UNAVAILABLE',message:'A product in your bag is no longer available.'},{status:409});if(product.stock<line.qty)return NextResponse.json({code:'OUT_OF_STOCK',message:`Only ${product.stock} units of ${product.name} remain.`},{status:409});subtotal+=product.price*line.qty;orderLines.push({productId:product.id,name:product.name,sku:product.id,size:line.size,color:product.color,quantity:line.qty,unitPrice:product.price,unitCost:product.cost,image:product.image})}
  const baseDelivery=subtotal>=store.settings.freeShippingFils?0:store.settings.standardDeliveryFils;
  const promotion=findEligiblePromotion(store,input.promotionCode,subtotal);const priced=pricePromotion(promotion,subtotal,baseDelivery);
  const paymentFee=input.payment==='cod'?store.settings.codFeeFils:0;const createdAt=new Date().toISOString();const number=nextOrderNumber(store.orders,createdAt);
  const order={id:crypto.randomUUID(),number,customer:`${input.firstName} ${input.lastName}`,email:input.email,mobile:input.mobile,total:subtotal-priced.discount+priced.delivery+paymentFee,subtotal,delivery:priced.delivery+paymentFee,discount:priced.discount,promotionId:priced.promotionId,promotionCode:priced.promotionCode,payment:input.payment,paymentStatus:'pending' as const,status:'pending' as const,createdAt,address:{area:input.area,block:input.block,street:input.street,building:input.building,floor:input.floor},lines:orderLines,idempotencyKey:input.idempotencyKey};
  const products=store.products.map(product=>{const line=input.lines.find(item=>item.id===product.id);return line?{...product,stock:product.stock-line.qty}:product});
  const promotions=promotion?store.promotions.map(item=>item.id===promotion.id?{...item,uses:(item.uses??0)+1}:item):store.promotions;
  const existing=store.customers.find(customer=>customer.email.toLowerCase()===input.email.toLowerCase());const customers=existing?store.customers.map(customer=>customer.id===existing.id?{...customer,name:order.customer,mobile:input.mobile,orders:customer.orders+1,spent:customer.spent+order.total,lastOrderAt:createdAt}:customer):[{id:crypto.randomUUID(),name:order.customer,email:input.email,mobile:input.mobile,orders:1,spent:order.total,createdAt,lastOrderAt:createdAt,tags:['New customer']},...store.customers];
  await writeAdminStore({...store,products,promotions,customers,orders:[order,...store.orders]},`Created ${input.payment.toUpperCase()} order`,number);
  return NextResponse.json({data:{number,total:order.total,status:order.status,payment:input.payment}},{status:201});
}
