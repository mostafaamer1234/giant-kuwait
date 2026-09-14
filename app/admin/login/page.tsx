import {redirect} from 'next/navigation';
import {AdminLogin} from '@/components/AdminLogin';
import {getAdminSession} from '@/lib/admin-auth';
export const dynamic='force-dynamic';
export default async function LoginPage(){if(await getAdminSession())redirect('/admin');return <AdminLogin/>}
