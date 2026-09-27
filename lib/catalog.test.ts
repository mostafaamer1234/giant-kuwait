import {describe,expect,it} from 'vitest';
import {bundleForQuantity,productLineTotal} from './catalog';

describe('multi-buy package pricing',()=>{
  const product={price:6000,bundles:[{id:'two',label:'2 for KWD 10',quantity:2,price:10000},{id:'ten',label:'10 for KWD 30',quantity:10,price:30000}]};
  it('uses the exact package total when quantity matches',()=>{expect(productLineTotal(product,2)).toBe(10000);expect(bundleForQuantity(product,10)?.label).toBe('10 for KWD 30')});
  it('uses ordinary unit pricing when quantity has no package',()=>{expect(productLineTotal(product,4)).toBe(24000)});
  it('does not match a package for a different quantity',()=>{expect(bundleForQuantity(product,3)).toBeUndefined()});
});
