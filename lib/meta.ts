import 'server-only';
import {createHash} from 'node:crypto';
import {get,put} from '@vercel/blob';

export type MetaEventName='PageView'|'ViewContent'|'AddToCart'|'InitiateCheckout'|'Purchase';
export type MetaTrackedEvent={id:string;name:MetaEventName;at:string;sourceUrl?:string;productId?:string;productName?:string;quantity?:number;valueFils?:number;currency:'KWD';delivered:boolean;error?:string};
export type MetaEventInput={eventId:string;name:MetaEventName;sourceUrl?:string;productId?:string;productName?:string;quantity?:number;valueFils?:number;email?:string;phone?:string;fbp?:string;fbc?:string;clientIp?:string;userAgent?:string};

const PATH='giant/meta-events.json';
let localEvents:MetaTrackedEvent[]=[];
const clean=(value:string)=>value.trim().toLowerCase();
const hash=(value?:string)=>value?createHash('sha256').update(clean(value)).digest('hex'):undefined;

async function readEvents(){
  if(!process.env.BLOB_READ_WRITE_TOKEN)return localEvents;
  try{const result=await get(PATH,{access:'private',useCache:false});if(!result||result.statusCode===304||!result.stream)return[];return await new Response(result.stream).json() as MetaTrackedEvent[]}catch{return[]}
}
async function saveEvents(events:MetaTrackedEvent[]){
  const limited=events.slice(0,5000);
  if(!process.env.BLOB_READ_WRITE_TOKEN){localEvents=limited;return}
  await put(PATH,JSON.stringify(limited),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:true,cacheControlMaxAge:0});
}

export async function trackMetaEvent(input:MetaEventInput){
  const pixelId=process.env.META_PIXEL_ID||process.env.NEXT_PUBLIC_META_PIXEL_ID||'1605822954383176';
  const token=process.env.META_CONVERSIONS_API_TOKEN;
  let delivered=false;let error:string|undefined;
  if(pixelId&&token){
    try{
      const userData:Record<string,string>={};
      if(input.clientIp)userData.client_ip_address=input.clientIp;
      if(input.userAgent)userData.client_user_agent=input.userAgent;
      if(input.fbp)userData.fbp=input.fbp;
      if(input.fbc)userData.fbc=input.fbc;
      const email=hash(input.email);if(email)userData.em=email;
      const phone=hash(input.phone?.replace(/\D/g,''));if(phone)userData.ph=phone;
      const customData:Record<string,unknown>={currency:'KWD'};
      if(input.valueFils!=null)customData.value=input.valueFils/1000;
      if(input.productId){customData.content_ids=[input.productId];customData.content_type='product'}
      if(input.productName)customData.content_name=input.productName;
      if(input.quantity!=null)customData.num_items=input.quantity;
      const version=process.env.META_GRAPH_API_VERSION||'v23.0';
      const response=await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:[{event_name:input.name,event_time:Math.floor(Date.now()/1000),event_id:input.eventId,action_source:'website',event_source_url:input.sourceUrl,user_data:userData,custom_data:customData}]})});
      delivered=response.ok;if(!response.ok){const payload=await response.json().catch(()=>null) as {error?:{message?:string}}|null;error=payload?.error?.message?.slice(0,180)||`Meta API ${response.status}`}
    }catch(reason){error=reason instanceof Error?reason.message.slice(0,180):'Meta delivery failed'}
  }else error='Server credentials not configured';
  const event:MetaTrackedEvent={id:input.eventId,name:input.name,at:new Date().toISOString(),sourceUrl:input.sourceUrl,productId:input.productId,productName:input.productName,quantity:input.quantity,valueFils:input.valueFils,currency:'KWD',delivered,error};
  const existing=await readEvents();await saveEvents([event,...existing.filter(item=>item.id!==event.id)]);
  return event;
}

export async function getMetaDashboard(days?:number){
  const allEvents=await readEvents();const cutoff=days?Date.now()-days*86400000:0;const events=cutoff?allEvents.filter(event=>new Date(event.at).getTime()>=cutoff):allEvents;
  const counts=Object.fromEntries(['PageView','ViewContent','AddToCart','InitiateCheckout','Purchase'].map(name=>[name,events.filter(event=>event.name===name).length])) as Record<MetaEventName,number>;
  const purchases=events.filter(event=>event.name==='Purchase');
  const productMap=new Map<string,{name:string;views:number;adds:number;purchases:number;revenueFils:number}>();
  for(const event of events){if(!event.productId)continue;const row=productMap.get(event.productId)||{name:event.productName||event.productId,views:0,adds:0,purchases:0,revenueFils:0};if(event.name==='ViewContent')row.views++;if(event.name==='AddToCart')row.adds++;if(event.name==='Purchase'){row.purchases++;row.revenueFils+=event.valueFils||0}productMap.set(event.productId,row)}
  return{configured:true,capiConfigured:Boolean(process.env.META_CONVERSIONS_API_TOKEN),counts,revenueFils:purchases.reduce((sum,event)=>sum+(event.valueFils||0),0),deliveryRate:events.length?Math.round(events.filter(event=>event.delivered).length/events.length*100):0,topProducts:[...productMap.entries()].map(([id,value])=>({id,...value})).sort((a,b)=>(b.revenueFils+b.adds*1000)-(a.revenueFils+a.adds*1000)).slice(0,12),recent:events.slice(0,50)};
}
