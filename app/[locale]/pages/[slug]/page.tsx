import {Shell} from '@/components/StoreClient';
import type {Locale} from '@/lib/catalog';
import {getPublicContent} from '@/lib/catalog-store';

const fallback:Record<string,{title:string;body:string}>={faq:{title:'HOW CAN WE HELP?',body:'Orders, delivery, returns, sizing and product care—find quick answers below.'}};
export default async function Page({params}:{params:Promise<{locale:Locale;slug:string}>}){
  const{locale,slug}=await params;const page=await getPublicContent(slug);const ar=locale==='ar';const local=fallback[slug]||{title:slug.replaceAll('-',' ').toUpperCase(),body:'GIANT Kuwait customer information and policies.'};const title=page?(ar?page.titleAr:page.titleEn):local.title;const body=(page?(ar?page.bodyAr||page.bodyEn:page.bodyEn):local.body)||local.body;
  return <Shell locale={locale}><main className="content-page"><p>GIANT / INFORMATION</p><h1>{title}</h1><div className="content-ring">G</div><p>{body}</p>{['faq','delivery','returns'].includes(slug)&&['How do I track my order?','Can I change my order?','What is the return process?'].map(question=><details key={question}><summary>{question}</summary><p>Contact the GIANT care team with your order number and we will help you with the next step.</p></details>)}</main></Shell>
}
