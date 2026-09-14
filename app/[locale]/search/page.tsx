import { SearchView } from "@/components/CommercePages";
import { Shell } from "@/components/StoreClient";
import type { Locale } from "@/lib/catalog";
import {getCatalogProducts} from '@/lib/catalog-store';
export default async function Page({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const products=await getCatalogProducts();
  return (
    <Shell locale={locale}>
      <SearchView locale={locale} products={products}/>
    </Shell>
  );
}
