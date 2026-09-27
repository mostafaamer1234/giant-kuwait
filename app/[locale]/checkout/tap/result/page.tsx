import Link from 'next/link';
import {getTapCharge,reconcileTapCharge} from '@/lib/tap';
export const dynamic='force-dynamic';
export default async function TapResult({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<{tap_id?:string}>}){
  const [{locale},{tap_id:chargeId}]=await Promise.all([params,searchParams]);let status='PENDING';let number='';
  if(chargeId)try{const charge=await getTapCharge(chargeId);status=charge.status;const order=await reconcileTapCharge(charge);number=order?.number||''}catch{status='PENDING'}
  const paid=status==='CAPTURED';const failed=['FAILED','DECLINED','CANCELLED','ABANDONED','RESTRICTED','VOID'].includes(status);
  return <main className="order-success" dir={locale==='ar'?'rtl':'ltr'}><span className="success-ring">G</span><p>TAP PAYMENT {number&&`· ${number}`}</p><h1>{paid?(locale==='ar'?'تم تأكيد الدفع.':'PAYMENT CONFIRMED.'):failed?(locale==='ar'?'تعذر إتمام الدفع.':'PAYMENT NOT COMPLETED.'):(locale==='ar'?'جارٍ تأكيد الدفع.':'CONFIRMING PAYMENT.')}</h1><p>{paid?'Your order is confirmed and is moving to processing.':failed?'No payment was completed. You can return to checkout and try another method.':'Your order will update automatically after Tap confirms the charge.'}</p><Link className="btn dark" href={`/${locale}`}>BACK TO GIANT</Link></main>
}
