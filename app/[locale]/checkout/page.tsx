import {CheckoutView} from '@/components/CommercePages';import type {Locale} from '@/lib/catalog';
export default async function Page({params}:{params:Promise<{locale:Locale}>}){const{locale}=await params;return <CheckoutView locale={locale}/>}
