import 'server-only';
import {readAdminStore} from './admin-store';
export async function getCatalogProducts(){return(await readAdminStore()).products.filter(product=>product.status==='published')}
export async function getPublicSettings(){return(await readAdminStore()).settings}
export async function getPublicContent(slug:string){return(await readAdminStore()).content.find(page=>page.slug===slug&&page.status==='published')}
