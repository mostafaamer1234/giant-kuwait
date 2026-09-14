import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {adminCookie,createAdminSession,expiredAdminCookie,getAdminSession,validAdminCredentials} from '@/lib/admin-auth';

export const runtime='nodejs';
const Login=z.object({identifier:z.string().trim().min(1).max(120),password:z.string().min(8).max(200)});

export async function GET(){const session=await getAdminSession();return session?NextResponse.json({authenticated:true,user:{email:session.email,role:session.role}}):NextResponse.json({authenticated:false},{status:401})}
export async function POST(request:NextRequest){const origin=request.headers.get('origin');if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({code:'INVALID_ORIGIN',message:'Invalid request origin'},{status:403});const parsed=Login.safeParse(await request.json().catch(()=>null));if(!parsed.success||!await validAdminCredentials(parsed.data.identifier,parsed.data.password))return NextResponse.json({code:'INVALID_CREDENTIALS',message:'Incorrect username/email or password'},{status:401});const response=NextResponse.json({authenticated:true,user:{email:parsed.data.identifier,role:'administrator'}});response.cookies.set(adminCookie(createAdminSession(parsed.data.identifier)));return response}
export async function DELETE(request:NextRequest){const origin=request.headers.get('origin');if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({code:'INVALID_ORIGIN',message:'Invalid request origin'},{status:403});const response=NextResponse.json({authenticated:false});response.cookies.set(expiredAdminCookie());return response}
