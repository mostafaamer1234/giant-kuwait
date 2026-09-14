'use client';

import {useEffect,useRef,useState} from 'react';
import type {Locale,Product} from '@/lib/catalog';
import {calculateSizeRecommendation,getSizeGuide,type SizeGuide,type SizingRecommendation} from '@/lib/sizing';

export function SizeAssistant({product,locale}:{product:Product;locale:Locale}){
  const ar=locale==='ar';
  const [guide,setGuide]=useState<SizeGuide>(()=>getSizeGuide(product));
  const heightRef=useRef<HTMLInputElement>(null);
  const [height,setHeight]=useState('');
  const [weight,setWeight]=useState('');
  const [recommendation,setRecommendation]=useState<SizingRecommendation>();
  const [showGuide,setShowGuide]=useState(false);
  useEffect(()=>{void fetch(`/api/v1/catalog/products/${product.slug}/size-guide`,{cache:'no-store'}).then(async response=>response.ok?await response.json() as {guide?:SizeGuide}:null).then(payload=>{if(payload?.guide)setGuide(payload.guide)}).catch(()=>undefined);const focus=()=>heightRef.current?.focus();const guideOpen=()=>setShowGuide(true);window.addEventListener('giant-open-size-assistant',focus);window.addEventListener('giant-open-size-guide',guideOpen);return()=>{window.removeEventListener('giant-open-size-assistant',focus);window.removeEventListener('giant-open-size-guide',guideOpen)}},[product.slug]);
  const calculate=()=>setRecommendation(calculateSizeRecommendation(product,guide,{height:Number(height),weight:Number(weight)},'regular',locale));
  const apply=()=>{if(recommendation?.recommendedSize)window.dispatchEvent(new CustomEvent('giant-size-recommendation',{detail:{productId:product.id,size:recommendation.recommendedSize}}))};
  if(guide.fit==='one-size')return <section className="fit-quick one-size"><p>{ar?'توصية المقاس':'SIZE RECOMMENDATION'}</p><h3>{ar?'هذا المنتج بمقاس موحد':'THIS PRODUCT IS ONE SIZE'}</h3><button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('giant-size-recommendation',{detail:{productId:product.id,size:'ONE SIZE'}}))}>{ar?'اختيار المقاس الموحد':'APPLY ONE SIZE'}</button></section>;
  return <>
    <section className="fit-quick" aria-labelledby={`fit-title-${product.id}`}>
      <p>{ar?'تقدير سريع للمقاس':'QUICK SIZE ESTIMATE'}</p>
      <h3 id={`fit-title-${product.id}`}>{ar?'أدخل طولك ووزنك للحصول على توصية بالمقاس':'ENTER YOUR HEIGHT & WEIGHT FOR A SIZE RECOMMENDATION'}</h3>
      <small>{ar?'نقارن القيم بجدول هذا المنتج. التوصية تقديرية وقد تختلف حسب شكل الجسم وتفضيل الملاءمة.':'We compare these values with this product’s size chart. The result is an estimate and may vary with body proportions and fit preference.'}</small>
      <form onSubmit={event=>{event.preventDefault();calculate()}}>
        <label>{ar?'الطول (سم)':'HEIGHT (CM)'}<input ref={heightRef} type="number" inputMode="decimal" min="120" max="230" step="0.1" value={height} onChange={event=>setHeight(event.target.value)} placeholder="175" required/></label>
        <label>{ar?'الوزن (كجم)':'WEIGHT (KG)'}<input type="number" inputMode="decimal" min="30" max="220" step="0.1" value={weight} onChange={event=>setWeight(event.target.value)} placeholder="75" required/></label>
        <button disabled={!height||!weight}>{ar?'اقترح مقاسي':'RECOMMEND MY SIZE'}</button>
      </form>
      {recommendation&&<article className={`fit-quick-result ${recommendation.status}`} aria-live="polite"><div><span>{ar?'المقاس المقترح':'SUGGESTED SIZE'}</span><strong>{recommendation.recommendedSize||'—'}</strong></div><div><span>{ar?'درجة الثقة':'CONFIDENCE'}</span><b>{recommendation.confidence.toUpperCase()}</b></div><p>{recommendation.reasons[0]}</p>{recommendation.alternateSize&&<small>{ar?`قريب أيضاً من ${recommendation.alternateSize}`:`Also close to ${recommendation.alternateSize}`}</small>}{recommendation.recommendedSize&&<button type="button" onClick={apply}>{ar?'اختيار هذا المقاس':'APPLY SIZE'}</button>}</article>}
      <button className="fit-guide-link" type="button" onClick={()=>setShowGuide(true)}>{ar?'عرض دليل المقاسات الكامل':'VIEW FULL SIZE GUIDE'}</button>
    </section>
    {showGuide&&<div className="guide-backdrop" onClick={()=>setShowGuide(false)}><section className="size-guide-modal" dir={ar?'rtl':'ltr'} role="dialog" aria-modal="true" aria-label={ar?'دليل المقاسات':'Size guide'} onClick={event=>event.stopPropagation()}><header><div><small>{ar?'دليل GIANT':'GIANT GUIDE'}</small><h2>{ar?guide.name.ar:guide.name.en}</h2></div><button onClick={()=>setShowGuide(false)} aria-label={ar?'إغلاق':'Close'}>×</button></header><p className="guide-notice">{ar?'قياسات الجسم بالسنتيمتر. القياس المباشر هو الطريقة الأكثر دقة لاختيار المقاس.':'Standard body measurements in centimetres. Measuring directly is the most accurate way to choose a size.'}</p><div className="guide-table-wrap"><table><thead><tr><th>{ar?'المقاس':'SIZE'}</th>{guide.measurements.map(item=><th key={item.code}>{ar?item.label.ar:item.label.en}<small> {item.canonicalUnit.toUpperCase()}</small></th>)}</tr></thead><tbody>{guide.bands.map(band=><tr key={band.size}><th>{band.size}</th>{guide.measurements.map(item=><td key={item.code}>{band.ranges[item.code]?.join('–')||'—'}</td>)}</tr>)}</tbody></table></div><div className="guide-instructions">{guide.measurements.map(item=><details key={item.code}><summary>{ar?item.label.ar:item.label.en}</summary><p>{ar?item.instruction.ar:item.instruction.en}</p></details>)}</div><button className="fit-apply" onClick={()=>setShowGuide(false)}>{ar?'إغلاق':'CLOSE GUIDE'}</button></section></div>}
  </>;
}
