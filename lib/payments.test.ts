import {createHmac} from "node:crypto";
import {describe,expect,it} from "vitest";
import {verifyMyFatoorahWebhook,type MyFatoorahWebhook} from "./payment-signatures";

describe("MyFatoorah webhook verification",()=>{
  const payload:MyFatoorahWebhook={Event:{Code:1,Name:"PAYMENT_STATUS_CHANGED"},Data:{Invoice:{Id:"6409988",Status:"PAID",ExternalIdentifier:"order-123"},Transaction:{Status:"SUCCESS",PaymentId:"07076409988323998875"}}};
  it("accepts the documented ordered HMAC-SHA256 signature",()=>{const secret="test-secret";const source="Invoice.Id=6409988,Invoice.Status=PAID,Transaction.Status=SUCCESS,Transaction.PaymentId=07076409988323998875,Invoice.ExternalIdentifier=order-123";const signature=createHmac("sha256",secret).update(source,"utf8").digest("base64");expect(verifyMyFatoorahWebhook(payload,signature,secret)).toBe(true)});
  it("rejects a modified signature",()=>expect(verifyMyFatoorahWebhook(payload,"invalid","test-secret")).toBe(false));
});
