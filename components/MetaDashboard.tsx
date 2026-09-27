'use client';
import {useCallback,useEffect,useState} from 'react';
type Dashboard={configured:boolean;capiConfigured:boolean;counts:Record<string,number>;revenueFils:number;deliveryRate:number;topProducts:Array<{id:string;name:string;views:number;adds:number;purchases:number;revenueFils:number}>;recent:Array<{id:string;name:string;at:string;delivered:boolean;productName?:string;valueFils?:number}>};
const kwd=(fils:number)=>new Intl.NumberFormat('en-KW',{style:'currency',currency:'KWD',minimumFractionDigits:3}).format(fils/1000);
export function MetaDashboard(){
  const [data,setData]=useState<Dashboard|null>(null);const [error,setError]=useState('');const [range,setRange]=useState('30');
  const load=useCallback((nextRange=range)=>fetch(`/api/v1/admin/meta${nextRange==='all'?'':`?days=${nextRange}`}`,{cache:'no-store'}).then(async response=>{const payload=await response.json() as {data?:Dashboard};if(!response.ok||!payload.data)throw new Error('Could not load Meta analytics');setData(payload.data);setError('')}).catch(reason=>setError(reason instanceof Error?reason.message:'Could not load analytics')),[range]);
  useEffect(()=>{void load()},[load]);
  function choose(next:string){setRange(next);setData(null)}
  if(error)return <section className="admin-module"><p>{error}</p><button onClick={()=>load()}>TRY AGAIN</button></section>;
  if(!data)return <section className="admin-module"><p>Loading Meta analytics…</p></section>;
  return <section className="admin-module meta-dashboard">
    <div className="admin-toolbar"><div><p>CAMPAIGN ATTRIBUTION</p><h2>META PIXEL + CONVERSIONS API</h2></div><button onClick={()=>load()}>REFRESH</button></div>
    <div className="receipt-filters" aria-label="Analytics date range">{[['7','7 DAYS'],['30','30 DAYS'],['365','1 YEAR'],['all','ALL TIME']].map(item=><button type="button" className={range===item[0]?'active':''} onClick={()=>choose(item[0])} key={item[0]}>{item[1]}</button>)}</div>
    <div className="meta-readiness"><span className={data.configured?'ready':''}>PIXEL {data.configured?'CONNECTED':'MISSING'}</span><span className={data.capiConfigured?'ready':''}>CAPI {data.capiConfigured?'CONNECTED':'MISSING'}</span><span>DELIVERY {data.deliveryRate}%</span></div>
    <div className="stats">{Object.entries(data.counts).map(([name,count])=><article key={name}><p>{name.replace(/([A-Z])/g,' $1').trim()}</p><h2>{count}</h2><span>Tracked events</span></article>)}<article><p>Tracked purchase value</p><h2>{kwd(data.revenueFils)}</h2><span>Purchase events</span></article></div>
    <div className="meta-grid"><article><h3>PRODUCT PERFORMANCE</h3><div className="meta-table"><div><b>PRODUCT</b><b>VIEWS</b><b>ADDS</b><b>SALES</b><b>VALUE</b></div>{data.topProducts.map(row=><div key={row.id}><span>{row.name}<small>{row.id}</small></span><span>{row.views}</span><span>{row.adds}</span><span>{row.purchases}</span><span>{kwd(row.revenueFils)}</span></div>)}</div></article><article><h3>RECENT EVENTS</h3>{data.recent.slice(0,15).map(event=><p className="meta-event" key={event.id}><span><b>{event.name}</b><small>{event.productName||new Date(event.at).toLocaleString()}</small></span><em className={event.delivered?'sent':'pending'}>{event.delivered?'SENT':'LOCAL'}</em></p>)}</article></div>
    <p className="payment-security-note">This dashboard stores event names, product attribution and values only. The Conversion API token stays server-side.</p>
  </section>;
}
