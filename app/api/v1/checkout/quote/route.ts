import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts, getPublicSettings } from "@/lib/catalog-store";
export async function POST(req: NextRequest) {
  const [products,settings] = await Promise.all([getCatalogProducts(),getPublicSettings()]);
  const body = (await req.json()) as { lines?: { id: string; qty: number }[] };
  const subtotal = (body.lines || []).reduce(
    (sum, l) =>
      sum +
      (products.find((p) => p.id === l.id)?.price || 0) * Math.max(1, l.qty),
    0,
  );
  const delivery = subtotal >= settings.freeShippingFils ? 0 : 2000;
  return NextResponse.json({
    data: {
      subtotal: { amount: subtotal, currency: "KWD" },
      delivery: { amount: delivery, currency: "KWD" },
      discount: { amount: 0, currency: "KWD" },
      total: { amount: subtotal + delivery, currency: "KWD" },
      expiresInSeconds: 900,
    },
  });
}
