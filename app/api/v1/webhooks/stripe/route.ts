import {NextRequest,NextResponse} from "next/server";
import Stripe from "stripe";
import {getStripe,reconcileStripeSession} from "@/lib/stripe";

export const runtime="nodejs";
export async function POST(request:NextRequest){const signature=request.headers.get("stripe-signature");const secret=process.env.STRIPE_WEBHOOK_SECRET;if(!signature||!secret)return NextResponse.json({code:"WEBHOOK_NOT_CONFIGURED"},{status:400});let event:Stripe.Event;try{event=getStripe().webhooks.constructEvent(await request.text(),signature,secret)}catch{return NextResponse.json({code:"INVALID_SIGNATURE"},{status:400})}if(["checkout.session.completed","checkout.session.async_payment_succeeded","checkout.session.async_payment_failed","checkout.session.expired"].includes(event.type))await reconcileStripeSession(event.data.object as Stripe.Checkout.Session,event.type);return NextResponse.json({received:true})}
