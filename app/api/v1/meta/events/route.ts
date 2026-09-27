import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {trackMetaEvent} from '@/lib/meta';

export const runtime='nodejs';
const Input=z.object({eventId:z.string().min(8).max(100),name:z.enum(['PageView','ViewContent','AddToCart','InitiateCheckout']),sourceUrl:z.string().url().max(2048).optional(),productId:z.string().max(100).optional(),productName:z.string().max(180).optional(),quantity:z.number().int().min(1).max(100).optional(),valueFils:z.number().int().min(0).optional(),fbp:z.string().max(200).optional(),fbc:z.string().max(200).optional()});
export async function POST(request:NextRequest){const parsed=Input.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({code:'INVALID_EVENT'},{status:400});const forwarded=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();await trackMetaEvent({...parsed.data,clientIp:forwarded,userAgent:request.headers.get('user-agent')||undefined});return NextResponse.json({accepted:true},{status:202})}
