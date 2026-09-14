import {notFound} from 'next/navigation';
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;if(!['en','ar'].includes(locale))notFound();return <div dir={locale==='ar'?'rtl':'ltr'} lang={locale}>{children}</div>}
