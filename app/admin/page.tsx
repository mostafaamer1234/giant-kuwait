import {redirect} from 'next/navigation';
import {AdminConsole} from '@/components/AdminConsole';
import {getAdminSession} from '@/lib/admin-auth';
import {readAdminStore} from '@/lib/admin-store';
export const dynamic='force-dynamic';
const allowedTabs=['Overview','Products','Inventory','Orders','Customers','Promotions','Receipts','Payments','Website editor','Content','Sizing guides','Settings'] as const;
export default async function Admin({searchParams}:{searchParams:Promise<{tab?:string}>}){const session=await getAdminSession();if(!session)redirect('/admin/login');const {tab}=await searchParams;const initialTab=allowedTabs.find(item=>item===tab)??'Overview';return <AdminConsole initialStore={await readAdminStore()} email={session.email} initialTab={initialTab}/>}
