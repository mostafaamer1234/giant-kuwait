import {NextRequest,NextResponse} from 'next/server';
import {getTapCharge,reconcileTapCharge} from '@/lib/tap';
export const runtime='nodejs';
export async function POST(request:NextRequest){
  if(!process.env.TAP_SECRET_KEY)return NextResponse.json({code:'PAYMENT_NOT_CONFIGURED'},{status:503});
  const body=await request.json().catch(()=>null) as {id?:string}|null;if(!body?.id)return NextResponse.json({code:'INVALID_EVENT'},{status:400});
  try{const charge=await getTapCharge(body.id);await reconcileTapCharge(charge);return NextResponse.json({received:true})}catch{return NextResponse.json({code:'TAP_VERIFICATION_FAILED'},{status:502})}
}
