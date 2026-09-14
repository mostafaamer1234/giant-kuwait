import 'server-only';
import {createHmac,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {readAdminStore,type AdminAccount} from '@/lib/admin-store';

const COOKIE_NAME='giant_admin_session';
type Session={email:string;role:'administrator';exp:number};

const encode=(value:string)=>Buffer.from(value).toString('base64url');
const secret=()=>{if(process.env.ADMIN_SESSION_SECRET)return process.env.ADMIN_SESSION_SECRET;if(process.env.NODE_ENV==='production')throw new Error('ADMIN_SESSION_SECRET is required');return'local-development-secret-change-me'};
const signature=(payload:string)=>createHmac('sha256',secret()).update(payload).digest('base64url');

export function createAdminSession(email:string){const payload=encode(JSON.stringify({email,role:'administrator',exp:Date.now()+1000*60*60*12} satisfies Session));return `${payload}.${signature(payload)}`}
export function verifyAdminSession(token?:string|null):Session|null{if(!token)return null;const [payload,sig]=token.split('.');if(!payload||!sig)return null;const expected=signature(payload);const a=Buffer.from(sig);const b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))return null;try{const parsed=JSON.parse(Buffer.from(payload,'base64url').toString()) as Session;return parsed.exp>Date.now()&&parsed.role==='administrator'?parsed:null}catch{return null}}
export async function getAdminSession(){return verifyAdminSession((await cookies()).get(COOKIE_NAME)?.value)}
export function adminCookie(token:string){return{name:COOKIE_NAME,value:token,httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:60*60*12}}
export function expiredAdminCookie(){return{name:COOKIE_NAME,value:'',httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:0}}
function matches(value:string,expected:string){const a=Buffer.from(value);const b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b)}
export function hashAdminPassword(password:string){const salt=randomBytes(16).toString('hex');const hash=scryptSync(password,salt,64).toString('hex');return `scrypt:${salt}:${hash}`}
export function verifyAdminPassword(password:string,passwordHash:string){const [algorithm,salt,expected]=passwordHash.split(':');if(algorithm!=='scrypt'||!salt||!expected)return false;const calculated=scryptSync(password,salt,64).toString('hex');return matches(calculated,expected)}
export async function getAdminAccount():Promise<Omit<AdminAccount,'passwordHash'>>{const saved=(await readAdminStore()).adminAccount;return saved?{username:saved.username,email:saved.email,updatedAt:saved.updatedAt}:{username:process.env.ADMIN_USERNAME||'admin',email:process.env.ADMIN_EMAIL||'admin@giant.com',updatedAt:''}}
export async function validAdminCredentials(identifier:string,password:string){const saved=(await readAdminStore()).adminAccount;if(saved){const identity=identifier.trim().toLowerCase();return(identity===saved.email.toLowerCase()||identity===saved.username.toLowerCase())&&verifyAdminPassword(password,saved.passwordHash)}if(process.env.NODE_ENV==='production'&&(!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD))return false;const expectedEmail=process.env.ADMIN_EMAIL||'admin@giant.com';const expectedUsername=process.env.ADMIN_USERNAME||'admin';const identity=identifier.trim().toLowerCase();return(identity===expectedEmail.toLowerCase()||identity===expectedUsername.toLowerCase())&&matches(password,process.env.ADMIN_PASSWORD||'GiantAdmin!2026')}
