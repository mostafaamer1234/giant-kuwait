import {AccountView} from '@/components/CommercePages';import {Shell} from '@/components/StoreClient';import type {Locale} from '@/lib/catalog';
export default async function Page({params}:{params:Promise<{locale:Locale}>}){const{locale}=await params;return <Shell locale={locale}><AccountView locale={locale}/></Shell>}
