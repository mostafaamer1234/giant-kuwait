import {describe,expect,it} from 'vitest';
import {products} from './catalog';
import {calculateSizeRecommendation,getSizeGuide,toCentimetres,toKilograms} from './sizing';

const leggings=products.find(product=>product.name==='Form Seamless Set')!;
const oneSize=products.find(product=>product.name==='G-Ring Cap')!;

describe('GIANT sizing calculator',()=>{
  it('converts inches to centimetres deterministically',()=>expect(toCentimetres(30,'in')).toBe(76.2));
  it('converts pounds to kilograms deterministically',()=>expect(toKilograms(159,'lb')).toBe(72.1));
  it('estimates a size from height and weight',()=>{
    const result=calculateSizeRecommendation(leggings,getSizeGuide(leggings),{height:168,weight:68},'regular','en');
    expect(result.status).toBe('recommended');expect(result.recommendedSize).toBe('M');expect(result.confidence).toBe('low');
  });
  it('uses conventional body measurements with higher confidence',()=>{const result=calculateSizeRecommendation(leggings,getSizeGuide(leggings),{waist:74,hips:98},'regular','en');expect(result.status).toBe('recommended');expect(result.recommendedSize).toBe('M');expect(['high','medium']).toContain(result.confidence)});
  it('moves at most one size for a relaxed preference',()=>{
    const result=calculateSizeRecommendation(leggings,getSizeGuide(leggings),{height:168,weight:68},'relaxed','en');
    expect(result.recommendedSize).toBe('L');
  });
  it('does not guess outside the published chart',()=>{
    const result=calculateSizeRecommendation(leggings,getSizeGuide(leggings),{height:168,weight:250},'regular','en');
    expect(result.status).toBe('cannot_recommend');expect(result.recommendedSize).toBeNull();
  });
  it('asks for missing required measurements',()=>{
    const result=calculateSizeRecommendation(leggings,getSizeGuide(leggings),{height:168},'regular','en');
    expect(result.status).toBe('collecting');expect(result.missingMeasurements).toContain('weight');
  });
  it('handles one-size products without body measurements',()=>{
    const result=calculateSizeRecommendation(oneSize,getSizeGuide(oneSize),{},'regular','en');
    expect(result.recommendedSize).toBe('ONE SIZE');expect(result.confidence).toBe('high');
  });
  it('returns equivalent recommendations in Arabic',()=>{
    const en=calculateSizeRecommendation(leggings,getSizeGuide(leggings),{height:168,weight:68},'regular','en');
    const ar=calculateSizeRecommendation(leggings,getSizeGuide(leggings),{height:168,weight:68},'regular','ar');
    expect(ar.recommendedSize).toBe(en.recommendedSize);expect(ar.reasons[0]).not.toBe(en.reasons[0]);
  });
});
