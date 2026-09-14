'use client';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {AdminOrder,ManagedProduct} from '@/lib/admin-store';
import {filterOrdersByRange,isCompletedPurchase,orderCost,type ReceiptRange} from '@/lib/commerce-analytics';

const money=(fils:number)=>new Intl.NumberFormat('en-KW',{style:'currency',currency:'KWD',minimumFractionDigits:3}).format(fils/1000);
const options:Array<[ReceiptRange,string]>=[['today','Today'],['yesterday','Yesterday'],['7d','Last 7 days'],['30d','Last 30 days'],['year','This year'],['all','All time']];
const itemCount=(order:AdminOrder)=>(order.lines||[]).reduce((sum,line)=>sum+line.quantity,0);
function escapeCsv(value:string|number){const valueText=String(value);return /[",\n]/.test(valueText)?`"${valueText.replaceAll('"','""')}"`:valueText}

export function ReceiptModule({orders,products}:{orders:AdminOrder[];products:ManagedProduct[]}){
  const [range,setRange]=useState<ReceiptRange>('today');
  const [query,setQuery]=useState('');
  const [checked,setChecked]=useState<Set<string>>(()=>new Set());
  const [message,setMessage]=useState('');
  const selectAllRef=useRef<HTMLInputElement>(null);
  const periodOrders=useMemo(()=>filterOrdersByRange(orders,range).filter(isCompletedPurchase),[orders,range]);
  const visible=useMemo(()=>{const needle=query.trim().toLowerCase();return needle?periodOrders.filter(order=>[order.number,order.customer,order.email,order.mobile].some(value=>String(value||'').toLowerCase().includes(needle))):periodOrders},[periodOrders,query]);
  const chosen=useMemo(()=>periodOrders.filter(order=>checked.has(order.id)),[periodOrders,checked]);
  const items=periodOrders.reduce((sum,order)=>sum+itemCount(order),0);
  const net=periodOrders.reduce((sum,order)=>sum+order.total,0);
  const costs=periodOrders.reduce((sum,order)=>sum+orderCost(order,products),0);
  const delivery=periodOrders.reduce((sum,order)=>sum+(order.delivery??0),0);
  const visibleSelected=visible.filter(order=>checked.has(order.id)).length;
  const allVisibleSelected=visible.length>0&&visibleSelected===visible.length;

  useEffect(()=>{if(selectAllRef.current)selectAllRef.current.indeterminate=visibleSelected>0&&!allVisibleSelected},[visibleSelected,allVisibleSelected]);
  function changeRange(next:ReceiptRange){setRange(next);setChecked(new Set());setQuery('');setMessage('')}
  function toggle(id:string){setChecked(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next})}
  function toggleVisible(){setChecked(current=>{const next=new Set(current);if(allVisibleSelected)visible.forEach(order=>next.delete(order.id));else visible.forEach(order=>next.add(order.id));return next})}
  function selectedPdf(layout:'combined'|'individual'='combined'){return `/api/v1/admin/receipts/pdf?orderIds=${encodeURIComponent(chosen.map(order=>order.id).join(','))}&layout=${layout}`}
  function downloadCsv(){const rows=[['Order','Date','Customer','Email','Items','Subtotal KWD','Delivery KWD','Discount KWD','Total KWD','Payment','Status'],...chosen.map(order=>[order.number,new Date(order.createdAt).toLocaleDateString('en-KW'),order.customer,order.email||'',itemCount(order),((order.subtotal??order.total)/1000).toFixed(3),((order.delivery??0)/1000).toFixed(3),((order.discount??0)/1000).toFixed(3),(order.total/1000).toFixed(3),order.payment||'',order.status])];const blob=new Blob([rows.map(row=>row.map(escapeCsv).join(',')).join('\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=`giant-receipts-${range}.csv`;anchor.click();URL.revokeObjectURL(url);setMessage(`${chosen.length} receipt${chosen.length===1?'':'s'} exported.`)}
  async function copyNumbers(){try{await navigator.clipboard.writeText(chosen.map(order=>order.number).join(', '));setMessage(`${chosen.length} order number${chosen.length===1?'':'s'} copied.`)}catch{setMessage('Copy was blocked by the browser. Use Export CSV instead.')}}

  return <section className="admin-module receipt-module">
    <div className="admin-toolbar"><div><p>SALES DOCUMENTS</p><h2>RECEIPTS</h2></div><a className="inline-action" href={`/api/v1/admin/receipts/pdf?range=${range}`} target="_blank" rel="noreferrer">PRINT VIEW ({periodOrders.length}) ↗</a></div>
    <div className="receipt-controls"><div className="receipt-filters" aria-label="Receipt period">{options.map(([value,label])=><button className={range===value?'active':''} aria-pressed={range===value} type="button" onClick={()=>changeRange(value)} key={value}>{label}</button>)}</div><label className="receipt-search"><span>SEARCH RECEIPTS</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Order, customer, email…"/></label></div>
    <div className="detail-stat-grid"><article><small>ORDERS</small><strong>{periodOrders.length}</strong><span>{options.find(item=>item[0]===range)?.[1]}</span></article><article><small>ITEMS SOLD</small><strong>{items}</strong><span>Captured units</span></article><article><small>NET SALES</small><strong>{money(net)}</strong><span>Including delivery</span></article><article><small>EST. PROFIT</small><strong>{money(net-delivery-costs)}</strong><span>Net sales less delivery and item cost</span></article></div>
    {chosen.length>0&&<div className="receipt-bulk-bar" role="region" aria-label="Selected receipt actions"><div><strong>{chosen.length} SELECTED</strong><span>{money(chosen.reduce((sum,order)=>sum+order.total,0))} total</span></div><div><a href={selectedPdf('combined')} target="_blank" rel="noreferrer" title="Combine selected orders into one summary receipt">PRINT COMBINED ↗</a><a href={selectedPdf('individual')} target="_blank" rel="noreferrer" title="Create one complete receipt page for every selected order">PRINT SEPARATELY ↗</a><button type="button" onClick={downloadCsv}>EXPORT CSV</button><button type="button" onClick={()=>void copyNumbers()}>COPY NUMBERS</button>{chosen.length===1&&<Link href={`/admin/orders/${chosen[0].id}`}>OPEN ORDER →</Link>}<button className="subtle" type="button" onClick={()=>setChecked(new Set())}>CLEAR</button></div></div>}
    <p className="receipt-status" role="status" aria-live="polite">{message}</p>
    <div className="receipt-orders"><div className="receipt-order head"><label className="receipt-check"><input ref={selectAllRef} type="checkbox" checked={allVisibleSelected} disabled={!visible.length} onChange={toggleVisible}/><span className="sr-only">Select all visible receipts</span></label><span>ORDER</span><span>DATE</span><span>ITEMS</span><span>TOTAL</span><span>ACTIONS</span></div>{visible.length?visible.map(order=><div className={`receipt-order${checked.has(order.id)?' selected':''}`} key={order.id}><label className="receipt-check"><input type="checkbox" checked={checked.has(order.id)} onChange={()=>toggle(order.id)}/><span className="sr-only">Select receipt {order.number}</span></label><span><Link href={`/admin/orders/${order.id}`}><b>{order.number}</b></Link><small>{order.customer}</small></span><span data-label="Date">{new Date(order.createdAt).toLocaleDateString('en-KW')}</span><span data-label="Items">{itemCount(order)}</span><span data-label="Total">{money(order.total)}</span><span className="receipt-row-actions"><Link href={`/admin/orders/${order.id}`}>VIEW</Link><a href={`/api/v1/admin/receipts/pdf?orderId=${order.id}`} target="_blank" rel="noreferrer">PRINT ↗</a></span></div>):<div className="receipt-empty"><b>{query?'No matching receipts.':'No completed purchases in this period.'}</b><p>{query?'Try a different order number, customer, or email.':'Switch to All time to review every completed receipt.'}</p>{query?<button type="button" onClick={()=>setQuery('')}>CLEAR SEARCH</button>:range!=='all'&&<button type="button" onClick={()=>changeRange('all')}>VIEW ALL RECEIPTS</button>}</div>}</div>
  </section>
}
