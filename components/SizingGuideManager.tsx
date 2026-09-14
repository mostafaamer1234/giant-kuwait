'use client';

import {useState} from 'react';
import type {ManagedProduct,StoredSizeGuide} from '@/lib/admin-store';
import type {MeasurementCode,SizeGuide} from '@/lib/sizing';

type Scope='category'|'product';
const clone=<T,>(value:T):T=>structuredClone(value);

export function SizingGuideManager({products,guides,busy,onSave,onReset}:{products:ManagedProduct[];guides:StoredSizeGuide[];busy:boolean;onSave:(payload:{scope:Scope;category?:ManagedProduct['category'];productId?:string;guide:StoredSizeGuide})=>Promise<unknown>;onReset:(productId:string)=>Promise<unknown>}){
  const [scope,setScope]=useState<Scope>('category');
  const [category,setCategory]=useState<ManagedProduct['category']>('women');
  const [productId,setProductId]=useState(products[0]?.id||'');
  const selectedProduct=products.find(item=>item.id===productId);
  const resolveSource=(nextScope:Scope,nextCategory:ManagedProduct['category'],nextProductId:string):StoredSizeGuide|undefined=>{
    const product=products.find(item=>item.id===nextProductId);
    if(nextScope==='product'&&product?.sizeGuideOverride)return {...product.sizeGuideOverride,verified:false};
    const guideId=nextScope==='product'?product?.sizeGuideId:products.find(item=>item.category===nextCategory)?.sizeGuideId;
    return guides.find(item=>item.id===guideId)||guides[0];
  };
  const [draft,setDraft]=useState<StoredSizeGuide|undefined>(()=>{
    const source=resolveSource('category','women',products[0]?.id||'');
    return source?clone(source):undefined;
  });
  const selectTarget=(nextScope:Scope,nextCategory:ManagedProduct['category'],nextProductId:string)=>{
    const source=resolveSource(nextScope,nextCategory,nextProductId);
    if(source)setDraft(clone(source));
  };
  if(!draft)return <section className="admin-module"><p>No sizing guides are available.</p></section>;
  const columns=draft.measurements.map(item=>item.code);
  const affected=products.filter(item=>item.category===category).length;
  const updateRange=(bandIndex:number,code:MeasurementCode,index:0|1,value:number)=>setDraft(current=>{if(!current)return current;const next=clone(current);const range=next.bands[bandIndex].ranges[code]||[0,0];range[index]=value;next.bands[bandIndex].ranges[code]=range;return next});
  return <section className="admin-module sizing-manager">
    <div className="admin-toolbar"><div><p>FIT DATA</p><h2>SIZE GUIDE MANAGER</h2></div><span>VERSIONED · STOREFRONT SYNCED</span></div>
    <div className="scope-switch" role="tablist"><button className={scope==='category'?'active':''} onClick={()=>{setScope('category');selectTarget('category',category,productId)}}>BY CATEGORY <small>DEFAULT</small></button><button className={scope==='product'?'active':''} onClick={()=>{setScope('product');selectTarget('product',category,productId)}}>BY PRODUCT <small>OVERRIDE</small></button></div>
    <div className="sizing-targets">
      {scope==='category'?<label>Category<select value={category} onChange={event=>{const next=event.target.value as ManagedProduct['category'];setCategory(next);selectTarget('category',next,productId)}}><option value="women">Women</option><option value="men">Men</option><option value="accessories">Accessories</option></select><small>Publishing assigns this chart to {affected} products in the category. Existing item overrides remain explicit.</small></label>:<label>Product<select value={productId} onChange={event=>{const next=event.target.value;setProductId(next);selectTarget('product',category,next)}}>{products.map(product=><option key={product.id} value={product.id}>{product.name} · {product.color}</option>)}</select><small>{selectedProduct?.sizeGuideOverride?'This product has a custom override.':'This product currently inherits its assigned category/family chart.'}</small></label>}
      <label>Starting guide<select value={draft.id} onChange={event=>{const nextGuide=guides.find(item=>item.id===event.target.value);if(nextGuide)setDraft(clone(nextGuide))}}>{guides.map(guide=><option key={guide.id} value={guide.id}>{guide.name.en}</option>)}</select></label>
    </div>
    <div className="guide-meta-grid">
      <label>English name<input value={draft.name.en} onChange={event=>setDraft({...draft,name:{...draft.name,en:event.target.value}})}/></label>
      <label>Arabic name<input dir="rtl" value={draft.name.ar} onChange={event=>setDraft({...draft,name:{...draft.name,ar:event.target.value}})}/></label>
      <label>Version<input value={draft.version} onChange={event=>setDraft({...draft,version:event.target.value})}/></label>
      <label>Measurement basis<select value={draft.basis} onChange={event=>setDraft({...draft,basis:event.target.value as SizeGuide['basis']})}><option value="body">Body measurements</option><option value="garment">Garment measurements</option></select></label>
      <label>Fit<select value={draft.fit} onChange={event=>setDraft({...draft,fit:event.target.value as SizeGuide['fit']})}>{['compression','sculpt','regular','relaxed','oversized','one-size'].map(item=><option key={item}>{item}</option>)}</select></label>
      <label>Stretch<select value={draft.stretch} onChange={event=>setDraft({...draft,stretch:event.target.value as SizeGuide['stretch']})}>{['none','low','medium','high'].map(item=><option key={item}>{item}</option>)}</select></label>
      <label className="check"><input type="checkbox" checked={draft.verified} onChange={event=>setDraft({...draft,verified:event.target.checked,placeholder:!event.target.checked})}/> Merchant verified</label>
    </div>
    <div className="measurement-definitions"><h3>MEASUREMENTS & CUSTOMER INSTRUCTIONS</h3>{draft.measurements.map((measurement,index)=><article key={measurement.code}><strong>{measurement.code.toUpperCase()}</strong><label>English label<input value={measurement.label.en} onChange={event=>setDraft(current=>{const next=clone(current!);next.measurements[index].label.en=event.target.value;return next})}/></label><label>Arabic label<input dir="rtl" value={measurement.label.ar} onChange={event=>setDraft(current=>{const next=clone(current!);next.measurements[index].label.ar=event.target.value;return next})}/></label><label className="wide">How to measure (English)<textarea value={measurement.instruction.en} onChange={event=>setDraft(current=>{const next=clone(current!);next.measurements[index].instruction.en=event.target.value;return next})}/></label><label className="wide">طريقة القياس (العربية)<textarea dir="rtl" value={measurement.instruction.ar} onChange={event=>setDraft(current=>{const next=clone(current!);next.measurements[index].instruction.ar=event.target.value;return next})}/></label><label className="check"><input type="checkbox" checked={measurement.required} onChange={event=>setDraft(current=>{const next=clone(current!);next.measurements[index].required=event.target.checked;return next})}/> Critical for size</label></article>)}</div>
    <div className="size-matrix-wrap"><table className="size-matrix"><thead><tr><th>SIZE</th>{columns.map(code=><th key={code} colSpan={2}>{code.toUpperCase()} <small>CM</small></th>)}<th></th></tr><tr><th></th>{columns.flatMap(code=>[<th key={`${code}-min`}>MIN</th>,<th key={`${code}-max`}>MAX</th>])}<th></th></tr></thead><tbody>{draft.bands.map((band,bandIndex)=><tr key={`${band.size}-${bandIndex}`}><th><input value={band.size} aria-label={`Size row ${bandIndex+1}`} onChange={event=>setDraft(current=>{if(!current)return current;const next=clone(current);next.bands[bandIndex].size=event.target.value;return next})}/></th>{columns.flatMap(code=>{const range=band.ranges[code]||[0,0];return [<td key={`${code}-min`}><input type="number" step="0.1" value={range[0]} onChange={event=>updateRange(bandIndex,code,0,Number(event.target.value))}/></td>,<td key={`${code}-max`}><input type="number" step="0.1" value={range[1]} onChange={event=>updateRange(bandIndex,code,1,Number(event.target.value))}/></td>]})}<td><button aria-label={`Delete ${band.size}`} onClick={()=>setDraft(current=>{const next=clone(current!);next.bands.splice(bandIndex,1);return next})}>×</button></td></tr>)}</tbody></table></div>
    <button className="add-size-row" onClick={()=>setDraft(current=>{const next=clone(current!);next.bands.push({size:'NEW',ranges:Object.fromEntries(columns.map(code=>[code,[0,0]]))});return next})}>+ ADD SIZE ROW</button>
    <div className="sizing-actions"><p>Enter standard body or garment measurements in centimetres. Height and weight are not stored in this chart; the storefront estimator derives a profile and compares it with these ranges. Inverted ranges are rejected.</p>{scope==='product'&&selectedProduct?.sizeGuideOverride&&<button disabled={busy} onClick={()=>void onReset(productId)}>USE CATEGORY GUIDE</button>}<button className="primary" disabled={busy} onClick={()=>void onSave({scope,category:scope==='category'?category:undefined,productId:scope==='product'?productId:undefined,guide:{...draft,scopeCategory:scope==='category'?category:undefined}})}>PUBLISH & SYNC</button></div>
  </section>;
}
