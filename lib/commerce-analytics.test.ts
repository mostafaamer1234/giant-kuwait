import {describe,expect,it} from "vitest";
import {filterOrdersByRange,promotionMetrics} from "./commerce-analytics";
import {findEligiblePromotion,pricePromotion} from "./promotions";
import type {AdminOrder,AdminPromotion,AdminStore,ManagedProduct} from "./admin-store";

const promotion:AdminPromotion={id:"promo-1",name:"Launch",code:"MOVE10",discount:10,active:true,clicks:20};
const product={id:"tee",price:20_000,cost:8_000} as ManagedProduct;
const paid:AdminOrder={id:"order-1",number:"GK-1",customer:"Customer",email:"c@example.com",subtotal:20_000,discount:2_000,delivery:2_000,total:20_000,promotionId:promotion.id,promotionCode:promotion.code,paymentStatus:"paid",status:"processing",createdAt:"2026-09-03T10:00:00.000Z",lines:[{productId:"tee",name:"Tee",sku:"TEE",color:"Black",quantity:1,unitPrice:20_000,unitCost:8_000}]};

describe("commerce analytics",()=>{
  it("attributes purchases, conversion, net sales and profit",()=>{const result=promotionMetrics(promotion,[paid],[product]);expect(result).toMatchObject({clicks:20,purchases:1,conversionRate:.05,grossSales:20_000,discounts:2_000,netSales:18_000,cost:8_000,profit:10_000,items:1})});
  it("filters receipt orders by Kuwait-style calendar periods",()=>{const orders=[paid,{...paid,id:"old",createdAt:"2026-08-20T10:00:00.000Z"}];expect(filterOrdersByRange(orders,"today",new Date("2026-09-03T12:00:00.000Z"))).toHaveLength(1);expect(filterOrdersByRange(orders,"all",new Date("2026-09-03T12:00:00.000Z"))).toHaveLength(2)});
});

describe("promotion pricing",()=>{
  const store={promotions:[promotion]} as AdminStore;
  it("finds an eligible code without case sensitivity",()=>expect(findEligiblePromotion(store,"move10",20_000)?.id).toBe("promo-1"));
  it("applies a percentage without changing delivery",()=>expect(pricePromotion(promotion,20_000,2_000)).toMatchObject({discount:2_000,delivery:2_000,promotionCode:"MOVE10"}));
  it("uses a zero-percent campaign as free delivery",()=>expect(pricePromotion({...promotion,discount:0},20_000,2_000)).toMatchObject({discount:0,delivery:0}));
});
