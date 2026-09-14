import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
const inter=Inter({variable:'--font-body',subsets:['latin']});
const space=Space_Grotesk({variable:'--font-display',subsets:['latin']});
export const metadata:Metadata={metadataBase:new URL(process.env.PUBLIC_SITE_ORIGIN||'http://localhost:3000'),title:'GIANT Kuwait — Performance Clothing',description:'Performance clothing engineered for movement. Shop GIANT training essentials in Kuwait.',openGraph:{title:'GIANT Kuwait',description:'Built to move big.',images:['/og.png']},twitter:{card:'summary_large_image',title:'GIANT Kuwait',description:'Built to move big.',images:['/og.png']}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${inter.variable} ${space.variable}`}>{children}</body></html>}
