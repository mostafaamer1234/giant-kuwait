import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCart, ProductCard, Shell, WishlistButton } from "@/components/StoreClient";
import { SizeAssistant } from "@/components/SizeAssistant";
import {MetaProductView} from '@/components/MetaPixel';
import { money, type Locale } from "@/lib/catalog";
import { getCatalogProducts,getPublicSettings } from "@/lib/catalog-store";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const products = await getCatalogProducts();
  const p = products.find((x) => x.slug === slug);
  return p
    ? {
        title: `${p.name} — GIANT Kuwait`,
        description: p.description,
        openGraph: {
          title: p.name,
          description: p.description,
          images: [p.image],
        },
        twitter: {
          card: "summary_large_image",
          title: p.name,
          description: p.description,
          images: [p.image],
        },
      }
    : { title: "Product not found" };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [products,settings] = await Promise.all([getCatalogProducts(),getPublicSettings()]);
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const colours = products.filter((x) => x.name === p.name);
  const gallery=Array.from(new Set([...(p.images||[]),p.image].filter(Boolean)));
  const assistantEnabled = settings.sizeAssistantEnabled;
  return (
    <Shell locale={locale}>
      <main className="pdp">
        <MetaProductView product={p}/>
        <div className={`pdp-gallery${gallery.length===1?' single':''}`}>
          {gallery.map((image,index)=><div key={`${image}-${index}`} style={{ backgroundImage: `url(${image})` }} />)}
        </div>
        <div className="pdp-info">
          <p className="breadcrumbs">
            HOME / {p.category.toUpperCase()} / {p.name.toUpperCase()}
          </p>
          {p.badge && <span className="pdp-badge">{p.badge}</span>}
          <div className="pdp-title-row"><h1>{locale === "ar" ? p.nameAr : p.name}</h1><WishlistButton product={p} locale={locale}/></div>
          <p>
            {p.fit} · {p.color}
          </p>
          <h2>{money(p.price, locale)}</h2>
          <div className="colour-row">
            <b>
              {locale === "ar" ? "اللون" : "COLOUR"}: {p.color}
            </b>
            <div>
              {colours.map((variant) => (
                <a
                  key={variant.id}
                  href={`/${locale}/product/${variant.slug}`}
                  className={`swatch ${variant.color.toLowerCase().replaceAll(" ", "-")} ${variant.id === p.id ? "selected" : ""}`}
                  aria-label={`${variant.color}${variant.id === p.id ? " selected" : ""}`}
                  aria-current={variant.id === p.id ? "page" : undefined}
                  title={variant.color}
                />
              ))}
            </div>
          </div>
          <AddToCart product={p} locale={locale} assistantEnabled={assistantEnabled} />
          {assistantEnabled && <SizeAssistant product={p} locale={locale} />}
          <details open>
            <summary>{locale === "ar" ? "الوصف" : "DESCRIPTION"}</summary>
            <p>{p.description}</p>
          </details>
          <details>
            <summary>
              {locale === "ar" ? "التوصيل والإرجاع" : "DELIVERY & RETURNS"}
            </summary>
            <p>
              Free delivery over KWD 25. Same-day options available by area.
            </p>
          </details>
        </div>
      </main>
      <section className="product-section recs">
        <div className="section-heading">
          <h2>{locale === "ar" ? "قد يعجبك أيضاً" : "YOU MAY ALSO LIKE"}</h2>
        </div>
        <div className="product-grid">
          {products
            .filter((x) => x.category === p.category && x.id !== p.id)
            .slice(0, 4)
            .map((x) => (
              <ProductCard key={x.id} p={x} locale={locale} />
            ))}
        </div>
      </section>
    </Shell>
  );
}
