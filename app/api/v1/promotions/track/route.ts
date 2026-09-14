import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {readAdminStore,writeAdminStore} from '@/lib/admin-store';

export const runtime='nodejs';
const Body=z.object({code:z.string().trim().min(1).max(40),event:z.literal('click')});
export async function POST(request:NextRequest){const parsed=Body.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({ok:false},{status:400});const store=await readAdminStore();const index=store.promotions.findIndex(item=>item.active&&item.code.toUpperCase()===parsed.data.code.toUpperCase());if(index<0)return NextResponse.json({ok:false},{status:404});const promotions=[...store.promotions];promotions[index]={...promotions[index],clicks:(promotions[index].clicks??0)+1};await writeAdminStore({...store,promotions},'Recorded promotion link click',promotions[index].id);return NextResponse.json({ok:true,code:promotions[index].code})}
