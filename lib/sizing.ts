import type {Locale, Product} from './catalog';

export type MeasurementUnit='cm'|'in';
export type WeightUnit='kg'|'lb';
export type FitPreference='snug'|'regular'|'relaxed';
export type RecommendationConfidence='high'|'medium'|'low';
export type MeasurementCode='height'|'weight'|'chest'|'bust'|'underbust'|'waist'|'hips'|'inseam';
export type MeasurementValues=Partial<Record<MeasurementCode,number>>;

export type MeasurementDefinition={code:MeasurementCode;label:{en:string;ar:string};instruction:{en:string;ar:string};plausible:[number,number];canonicalUnit:'cm'|'kg';required:boolean};
export type SizeBand={size:string;ranges:Partial<Record<MeasurementCode,[number,number]>>};
export type SizeGuide={id:string;version:string;name:{en:string;ar:string};basis:'body'|'garment'|'height-weight-estimate';status:'draft'|'published';placeholder:boolean;fit:'compression'|'sculpt'|'regular'|'relaxed'|'oversized'|'one-size';stretch:'none'|'low'|'medium'|'high';heightRule:'alpha-size'|'length-only'|'none';measurements:MeasurementDefinition[];bands:SizeBand[]};
export type SizingRecommendation={productId:string;sizeGuideVersion:string;recommendedSize:string|null;alternateSize?:string;confidence:RecommendationConfidence;reasons:string[];missingMeasurements:MeasurementCode[];status:'collecting'|'recommended'|'cannot_recommend'};
export type SizingSessionState={unit:MeasurementUnit|null;weightUnit:WeightUnit|null;measurements:MeasurementValues;fitPreference:FitPreference|null;pendingMeasurement:MeasurementCode|null};

const m=(code:MeasurementCode,en:string,ar:string,instructionEn:string,instructionAr:string,plausible:[number,number],canonicalUnit:'cm'|'kg',required=true):MeasurementDefinition=>({code,label:{en,ar},instruction:{en:instructionEn,ar:instructionAr},plausible,canonicalUnit,required});
const chest=m('chest','Chest','الصدر','Measure around the fullest part of your chest, keeping the tape level.','قس حول أعرض جزء من الصدر مع إبقاء الشريط مستوياً.',[60,180],'cm');
const bust=m('bust','Bust','محيط الصدر','Measure around the fullest part of your bust while wearing a non-padded bra.','قيسي حول أعرض جزء من الصدر مع حمالة غير مبطنة.',[60,160],'cm');
const underbust=m('underbust','Underbust','تحت الصدر','Measure firmly around your ribcage directly beneath the bust.','قيسي بإحكام حول القفص الصدري مباشرة أسفل الصدر.',[55,140],'cm');
const waist=m('waist','Waist','الخصر','Measure around your natural waist without pulling the tape tight.','قس حول الخصر الطبيعي دون شد الشريط.',[45,170],'cm');
const hips=m('hips','Hips','الأرداف','Measure around the fullest part of your hips and seat.','قس حول أعرض جزء من الأرداف.',[65,190],'cm');
const inseam=m('inseam','Inseam','طول الساق الداخلي','Measure from the crotch seam to the ankle along the inside leg.','قس من التقاء الساقين إلى الكاحل على طول الساق الداخلي.',[55,100],'cm');
const bands=(rows:Array<[string,Record<string,[number,number]>]>):SizeBand[]=>rows.map(([size,ranges])=>({size,ranges}));
const womenBottomBands=bands([['XS',{waist:[58,64],hips:[82,88],inseam:[74,78]}],['S',{waist:[64,70],hips:[88,94],inseam:[75,79]}],['M',{waist:[70,77],hips:[94,101],inseam:[76,80]}],['L',{waist:[77,85],hips:[101,109],inseam:[77,81]}],['XL',{waist:[85,95],hips:[109,119],inseam:[78,82]}],['XXL',{waist:[95,107],hips:[119,131],inseam:[79,83]}]]);
const womenTopBands=bands([['XS',{bust:[76,82],waist:[58,64]}],['S',{bust:[82,88],waist:[64,70]}],['M',{bust:[88,95],waist:[70,77]}],['L',{bust:[95,103],waist:[77,85]}],['XL',{bust:[103,113],waist:[85,95]}],['XXL',{bust:[113,125],waist:[95,107]}]]);
const braBands=bands([['XS',{bust:[76,82],underbust:[64,69]}],['S',{bust:[82,88],underbust:[69,74]}],['M',{bust:[88,95],underbust:[74,80]}],['L',{bust:[95,103],underbust:[80,87]}],['XL',{bust:[103,113],underbust:[87,95]}],['XXL',{bust:[113,125],underbust:[95,105]}]]);
const menTopBands=bands([['XS',{chest:[82,88],waist:[68,74]}],['S',{chest:[88,96],waist:[74,81]}],['M',{chest:[96,104],waist:[81,89]}],['L',{chest:[104,112],waist:[89,97]}],['XL',{chest:[112,122],waist:[97,107]}],['XXL',{chest:[122,134],waist:[107,119]}]]);
const menBottomBands=bands([['XS',{waist:[68,74],hips:[84,90],inseam:[76,80]}],['S',{waist:[74,81],hips:[90,97],inseam:[77,81]}],['M',{waist:[81,89],hips:[97,104],inseam:[78,82]}],['L',{waist:[89,97],hips:[104,112],inseam:[79,83]}],['XL',{waist:[97,107],hips:[112,122],inseam:[80,84]}],['XXL',{waist:[107,119],hips:[122,134],inseam:[81,85]}]]);
const unisexBands=bands([['XS',{chest:[82,90],waist:[64,72]}],['S',{chest:[90,98],waist:[72,80]}],['M',{chest:[98,106],waist:[80,88]}],['L',{chest:[106,116],waist:[88,98]}],['XL',{chest:[116,128],waist:[98,110]}],['XXL',{chest:[128,142],waist:[110,124]}]]);

export const sizeGuides:Record<string,SizeGuide>={
  'women-bottoms':{id:'women-bottoms',version:'3.0.0',name:{en:"Women's bottoms",ar:'ملابس نسائية سفلية'},basis:'body',status:'published',placeholder:true,fit:'sculpt',stretch:'high',heightRule:'length-only',measurements:[waist,hips,{...inseam,required:false}],bands:womenBottomBands},
  'women-tops':{id:'women-tops',version:'3.0.0',name:{en:"Women's tops",ar:'ملابس نسائية علوية'},basis:'body',status:'published',placeholder:true,fit:'regular',stretch:'medium',heightRule:'none',measurements:[bust,waist],bands:womenTopBands},
  'sports-bra':{id:'sports-bra',version:'3.0.0',name:{en:'Sports bras',ar:'حمالات رياضية'},basis:'body',status:'published',placeholder:true,fit:'compression',stretch:'high',heightRule:'none',measurements:[bust,underbust],bands:braBands},
  'men-tops':{id:'men-tops',version:'3.0.0',name:{en:"Men's tops",ar:'ملابس رجالية علوية'},basis:'body',status:'published',placeholder:true,fit:'regular',stretch:'medium',heightRule:'none',measurements:[chest,waist],bands:menTopBands},
  'men-bottoms':{id:'men-bottoms',version:'3.0.0',name:{en:"Men's bottoms",ar:'ملابس رجالية سفلية'},basis:'body',status:'published',placeholder:true,fit:'regular',stretch:'medium',heightRule:'length-only',measurements:[waist,hips,{...inseam,required:false}],bands:menBottomBands},
  'unisex-oversized':{id:'unisex-oversized',version:'3.0.0',name:{en:'Unisex oversized',ar:'ملابس واسعة للجميع'},basis:'body',status:'published',placeholder:true,fit:'oversized',stretch:'low',heightRule:'none',measurements:[chest,waist],bands:unisexBands},
  'one-size':{id:'one-size',version:'3.0.0',name:{en:'One size',ar:'مقاس واحد'},basis:'garment',status:'published',placeholder:true,fit:'one-size',stretch:'none',heightRule:'none',measurements:[],bands:[{size:'ONE SIZE',ranges:{}}]},
};

export const productSizeGuideIds:Record<string,string>={'Axis Training Tee':'unisex-oversized','Form Seamless Set':'women-bottoms','Orbit Studio Bra':'sports-bra','Core Lift Short':'men-bottoms','Arc Legging':'women-bottoms','Summit Hoodie':'unisex-oversized','Vector Tank':'men-tops','Motion Flare':'women-bottoms','G-Ring Cap':'one-size','Foundation Jogger':'men-bottoms','Pulse Crop':'women-tops','Transit Duffel':'one-size'};
export function getSizeGuide(product:Pick<Product,'sizeGuideId'>){return sizeGuides[product.sizeGuideId]}
export const toCentimetres=(value:number,unit:MeasurementUnit)=>Math.round((unit==='in'?value*2.54:value)*10)/10;
export const toKilograms=(value:number,unit:WeightUnit)=>Math.round((unit==='lb'?value*0.45359237:value)*10)/10;
export const fromCentimetres=(value:number,unit:MeasurementUnit)=>Math.round((unit==='in'?value/2.54:value)*10)/10;
function t(locale:Locale,en:string,ar:string){return locale==='ar'?ar:en}

export function estimateBodyMeasurements(guide:SizeGuide,heightCm:number,weightKg:number):MeasurementValues{
  const isWomen=guide.id.startsWith('women-')||guide.id==='sports-bra';
  const h=heightCm-(isWomen?165:175);const w=weightKg-(isWomen?63:78);
  const result:MeasurementValues={height:heightCm,weight:weightKg,inseam:Math.round(heightCm*.455*10)/10};
  if(isWomen){result.bust=Math.round((90+w*.48+h*.08)*10)/10;result.waist=Math.round((72+w*.58+h*.05)*10)/10;result.hips=Math.round((98+w*.52+h*.08)*10)/10;result.underbust=Math.round(((result.bust||90)-12)*10)/10;result.chest=result.bust}
  else{result.chest=Math.round((100+w*.52+h*.09)*10)/10;result.waist=Math.round((84+w*.62+h*.05)*10)/10;result.hips=Math.round((98+w*.48+h*.08)*10)/10;result.bust=result.chest;result.underbust=Math.round(((result.chest||100)-12)*10)/10}
  return result;
}

export function calculateSizeRecommendation(product:Pick<Product,'id'|'sizes'>,guide:SizeGuide,measurements:MeasurementValues,fitPreference:FitPreference='regular',locale:Locale='en'):SizingRecommendation{
  if(guide.status!=='published')return{productId:product.id,sizeGuideVersion:guide.version,recommendedSize:null,confidence:'low',reasons:[t(locale,'This size guide is not published yet.','دليل المقاسات غير منشور بعد.')],missingMeasurements:[],status:'cannot_recommend'};
  if(guide.fit==='one-size')return{productId:product.id,sizeGuideVersion:guide.version,recommendedSize:'ONE SIZE',confidence:'high',reasons:[t(locale,'This product is designed in one universal size.','هذا المنتج مصمم بمقاس موحد.')],missingMeasurements:[],status:'recommended'};
  if(guide.basis==='body'&&(measurements.height!=null||measurements.weight!=null)&&(measurements.height==null||measurements.weight==null)){const missingMeasurements:MeasurementCode[]=measurements.height==null?['height']:['weight'];return{productId:product.id,sizeGuideVersion:guide.version,recommendedSize:null,confidence:'low',reasons:[],missingMeasurements,status:'collecting'}}
  const estimated=measurements.height!=null&&measurements.weight!=null;const values=estimated?{...estimateBodyMeasurements(guide,measurements.height!,measurements.weight!),...measurements}:measurements;
  const required=guide.measurements.filter(item=>item.required).map(item=>item.code);const missing=required.filter(code=>values[code]==null);
  if(missing.length)return{productId:product.id,sizeGuideVersion:guide.version,recommendedSize:null,confidence:'low',reasons:[],missingMeasurements:missing,status:'collecting'};
  for(const definition of guide.measurements.filter(item=>item.required)){const value=values[definition.code]!;if(value<definition.plausible[0]||value>definition.plausible[1])return{productId:product.id,sizeGuideVersion:guide.version,recommendedSize:null,confidence:'low',reasons:[t(locale,`The estimated ${definition.label.en.toLowerCase()} is outside the supported chart.`,`قيمة ${definition.label.ar} التقديرية خارج نطاق الجدول.`)],missingMeasurements:[],status:'cannot_recommend'}}
  const ranked=guide.bands.map((band,index)=>{const scores=required.map(code=>{const range=band.ranges[code];if(!range)return 5;const half=Math.max(1,(range[1]-range[0])/2);return Math.abs(values[code]!-(range[0]+range[1])/2)/half});return{index,score:scores.reduce((sum,item)=>sum+item,0)/Math.max(1,scores.length)}}).sort((a,b)=>a.score-b.score);
  const best=ranked[0];const second=ranked[1];if(!best||best.score>3)return{productId:product.id,sizeGuideVersion:guide.version,recommendedSize:null,confidence:'low',reasons:[t(locale,'Your estimated body measurements fall outside this product’s current chart.','قياسات الجسم التقديرية خارج جدول هذا المنتج الحالي.')],missingMeasurements:[],status:'cannot_recommend'};
  const close=Boolean(second&&second.score-best.score<.18);let index=best.index;const canAdjust=guide.stretch==='medium'||guide.stretch==='high'||guide.fit==='oversized';if(canAdjust&&fitPreference==='snug')index=Math.max(0,index-1);if(canAdjust&&fitPreference==='relaxed')index=Math.min(guide.bands.length-1,index+1);
  const recommended=guide.bands[index]?.size;if(!recommended||!product.sizes.includes(recommended))return{productId:product.id,sizeGuideVersion:guide.version,recommendedSize:null,confidence:'low',reasons:[t(locale,'The estimated size is not available for this product.','المقاس التقديري غير متوفر لهذا المنتج.')],missingMeasurements:[],status:'cannot_recommend'};
  const alternativeBand=close?guide.bands[second.index]:undefined;const alternateSize=alternativeBand&&product.sizes.includes(alternativeBand.size)?alternativeBand.size:undefined;const confidence:RecommendationConfidence=estimated?'low':best.score>1.3?'low':close?'medium':'high';const used=required.map(code=>`${code} ${Math.round(values[code]!)}`).join(', ');
  return{productId:product.id,sizeGuideVersion:guide.version,recommendedSize:recommended,alternateSize,confidence,reasons:[estimated?t(locale,`We estimated standard chart measurements from your height and weight (${used} cm); ${recommended} is the closest match.`,`قدّرنا قياسات الجدول القياسية من طولك ووزنك (${used} سم)؛ والمقاس ${recommended} هو الأقرب.`):t(locale,`${recommended} is the closest match across your supplied body measurements.`,`المقاس ${recommended} هو الأقرب لقياسات الجسم التي أدخلتها.`),t(locale,'Height and weight are an estimate only. Direct body measurements are more accurate.','الطول والوزن يعطيان تقديراً فقط. قياسات الجسم المباشرة أكثر دقة.')],missingMeasurements:[],status:'recommended'};
}

export function nextQuestion(guide:SizeGuide,state:SizingSessionState,locale:Locale){const ar=locale==='ar';const pending=(['height','weight'] as MeasurementCode[]).find(code=>(guide.basis==='body'||guide.measurements.some(item=>item.code===code&&item.required))&&state.measurements[code]==null)||null;if(pending==='height')return{pending,message:ar?'ما طولك؟ مثال: 175 سم أو 5 أقدام و9 بوصات.':'What is your height? For example, 175 cm or 5 ft 9 in.',quickReplies:[] as string[]};if(pending==='weight')return{pending,message:ar?'ما وزنك؟ مثال: 72 كجم أو 159 رطلاً.':'What is your weight? For example, 72 kg or 159 lb.',quickReplies:[] as string[]};return{pending:null,message:'',quickReplies:[] as string[]}}
export function getMeasurementDefinition(guide:SizeGuide,code:MeasurementCode){return guide.measurements.find(item=>item.code===code)}
