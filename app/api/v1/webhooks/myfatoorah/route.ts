import {NextRequest,NextResponse} from "next/server";
import {reconcileMyFatoorah} from "@/lib/myfatoorah";
import {type MyFatoorahWebhook,verifyMyFatoorahWebhook} from "@/lib/payment-signatures";
export const runtime="nodejs";
export async function POST(request:NextRequest){const secret=process.env.MYFATOORAH_WEBHOOK_SECRET;const signature=request.headers.get("myfatoorah-signature")||"";if(!secret)return NextResponse.json({code:"PAYMENT_NOT_CONFIGURED"},{status:503});const payload=await request.json().catch(()=>null) as MyFatoorahWebhook|null;if(!payload||!verifyMyFatoorahWebhook(payload,signature,secret))return NextResponse.json({code:"INVALID_SIGNATURE"},{status:401});if(payload.Event?.Name==="PAYMENT_STATUS_CHANGED")await reconcileMyFatoorah(payload);return NextResponse.json({received:true})}
