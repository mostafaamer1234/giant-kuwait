import {NextRequest,NextResponse} from 'next/server';
import {getAdminSession} from '@/lib/admin-auth';
import {getMetaDashboard} from '@/lib/meta';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){if(!await getAdminSession())return NextResponse.json({code:'UNAUTHORIZED'},{status:401});const raw=request.nextUrl.searchParams.get('days');const days=raw?Number(raw):undefined;return NextResponse.json({data:await getMetaDashboard(days&&[7,30,365].includes(days)?days:undefined)})}
