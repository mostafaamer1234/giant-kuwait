import { CartView } from "@/components/CommercePages";
import { Shell } from "@/components/StoreClient";
import type { Locale } from "@/lib/catalog";
import {getCatalogProducts,getPublicSettings} from '@/lib/catalog-store';
export default async function Page({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const [products,settings]=await Promise.all([getCatalogProducts(),getPublicSettings()]);
  return (
    <Shell locale={locale}>
      <CartView locale={locale} products={products} freeShippingFils={settings.freeShippingFils}/>
    </Shell>
  );
}
