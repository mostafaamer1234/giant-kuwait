import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/catalog-store";
export async function GET(req: NextRequest) {
  const products = await getCatalogProducts();
  const url = req.nextUrl;
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q")?.toLowerCase();
  const data = products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!q || (p.name + " " + p.color + " " + p.fit).toLowerCase().includes(q)),
  );
  return NextResponse.json({
    data,
    meta: { count: data.length, currency: "KWD", nextCursor: null },
  });
}
