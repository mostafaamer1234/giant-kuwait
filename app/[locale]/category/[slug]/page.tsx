import { CatalogControls, Shell } from "@/components/StoreClient";
import { categories, type Locale } from "@/lib/catalog";
import { getCatalogProducts,getPublicSettings } from "@/lib/catalog-store";
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [products,settings] = await Promise.all([getCatalogProducts(),getPublicSettings()]);
  const cat = categories.find((c) => c.slug === slug);
  const items =
    slug === "new-arrivals"
      ? products
      : slug === "sale"
        ? products.filter((p) => p.compareAt)
        : products.filter((p) => p.category === slug);
  return (
    <Shell locale={locale}>
      <main className="catalog-page">
        <div className="catalog-hero">
          <p>GIANT / {slug.replaceAll("-", " ").toUpperCase()}</p>
          <h1>{locale === "ar" ? cat?.ar || slug : cat?.en || slug}</h1>
          <span>
            {locale === "ar"
              ? settings.websiteDesign.catalogTaglineAr
              : settings.websiteDesign.catalogTaglineEn}
          </span>
        </div>
        <CatalogControls items={items} locale={locale} />
      </main>
    </Shell>
  );
}
