import {NextResponse} from 'next/server';import {categories} from '@/lib/catalog';export async function GET(){return NextResponse.json({data:categories})}
