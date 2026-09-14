import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {adminCookie,createAdminSession,getAdminAccount,getAdminSession,hashAdminPassword,validAdminCredentials} from '@/lib/admin-auth';
import {readAdminStore,writeAdminStore} from '@/lib/admin-store';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const Password=z.string().min(12,'Use at least 12 characters').max(200).regex(/[a-z]/,'Add a lowercase letter').regex(/[A-Z]/,'Add an uppercase letter').regex(/[0-9]/,'Add a number').regex(/[^A-Za-z0-9]/,'Add a symbol');
const Update=z.object({currentPassword:z.string().min(1).max(200),username:z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9._-]+$/,'Use letters, numbers, dots, underscores or hyphens'),email:z.email(),newPassword:z.union([Password,z.literal('')])});
const sameOrigin=(request:NextRequest)=>{const origin=request.headers.get('origin');return !origin||origin===request.nextUrl.origin};

export async function GET(){if(!await getAdminSession())return NextResponse.json({code:'UNAUTHORIZED',message:'Sign in required'},{status:401});return NextResponse.json({data:await getAdminAccount()})}

export async function PATCH(request:NextRequest){const session=await getAdminSession();if(!session)return NextResponse.json({code:'UNAUTHORIZED',message:'Sign in required'},{status:401});if(!sameOrigin(request))return NextResponse.json({code:'INVALID_ORIGIN',message:'Invalid request origin'},{status:403});const parsed=Update.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({code:'INVALID_REQUEST',message:'Check the highlighted account fields',fieldErrors:z.flattenError(parsed.error).fieldErrors},{status:400});if(!await validAdminCredentials(session.email,parsed.data.currentPassword))return NextResponse.json({code:'INVALID_PASSWORD',message:'Current password is incorrect'},{status:401});const store=await readAdminStore();const passwordHash=parsed.data.newPassword?hashAdminPassword(parsed.data.newPassword):store.adminAccount?.passwordHash||hashAdminPassword(parsed.data.currentPassword);const updatedAt=new Date().toISOString();const next=await writeAdminStore({...store,adminAccount:{username:parsed.data.username,email:parsed.data.email.toLowerCase(),passwordHash,updatedAt}},'Updated administrator credentials','admin-account');const response=NextResponse.json({data:{username:next.adminAccount!.username,email:next.adminAccount!.email,updatedAt}});response.cookies.set(adminCookie(createAdminSession(next.adminAccount!.email)));return response}
