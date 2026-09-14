import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/catalog-store";
import {readAdminStore} from "@/lib/admin-store";
import { getSizeGuide } from "@/lib/sizing";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [products,store] = await Promise.all([getCatalogProducts(),readAdminStore()]);
  const product = products.find((item) => item.slug === slug);
  if (!product)
    return NextResponse.json(
      {
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found",
        requestId: crypto.randomUUID(),
      },
      { status: 404 },
    );
  const guide = product.sizeGuideOverride||store.sizingGuides.find(item=>item.id===product.sizeGuideId)||getSizeGuide(product);
  return NextResponse.json({
    productId: product.id,
    productSlug: product.slug,
    guide: {
      ...guide,
      placeholderNotice: guide.placeholder
        ? "Demo sizing data — merchant verification required before production."
        : undefined,
    },
  });
}
