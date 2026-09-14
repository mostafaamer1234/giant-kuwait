import {get} from '@vercel/blob';
import {NextRequest,NextResponse} from 'next/server';

export const runtime='nodejs';
export async function GET(request:NextRequest){const pathname=request.nextUrl.searchParams.get('path');if(!pathname?.startsWith('giant/product-media/'))return NextResponse.json({code:'NOT_FOUND'},{status:404});const result=await get(pathname,{access:'private'});if(!result||result.statusCode===304||!result.stream)return new NextResponse(null,{status:404});return new NextResponse(result.stream,{headers:{'Content-Type':result.blob.contentType||'application/octet-stream','Cache-Control':'public, max-age=31536000, immutable'}})}
