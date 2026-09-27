import {z} from "zod";

export const checkoutOrderSchema=z.object({email:z.email(),mobile:z.string().min(6),firstName:z.string().min(1),lastName:z.string().min(1),area:z.string().min(1),block:z.string().min(1),street:z.string().min(1),building:z.string().min(1),floor:z.string().optional(),promotionCode:z.string().trim().max(40).optional(),payment:z.enum(['knet','cod','stripe','tap']),locale:z.enum(['en','ar']).default('en'),idempotencyKey:z.string().min(8).max(100).optional(),lines:z.array(z.object({id:z.string(),size:z.string().optional(),qty:z.number().int().min(1).max(50)})).min(1)});
export type CheckoutOrderInput=z.infer<typeof checkoutOrderSchema>;
