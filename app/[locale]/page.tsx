import Link from "next/link";
import type {CSSProperties} from "react";
import { type Locale } from "@/lib/catalog";
import { getCatalogProducts,getPublicSettings } from "@/lib/catalog-store";
import { Mark, ProductCard, Shell } from "@/components/StoreClient";
export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const [products,settings] = await Promise.all([getCatalogProducts(),getPublicSettings()]);
  const ar = locale === "ar";
  const design=settings.homepageDesign;
  const fontStack=(font:string)=>font==='Georgia'?'Georgia, serif':`${font}, Arial, sans-serif`;
  return (
    <Shell locale={locale}>
      <main style={{fontFamily:fontStack(design.bodyFont)}}>
        <section className={`hero visual-shape-${design.heroShape}`} style={{minHeight:design.heroMinHeight,color:design.heroTextColor,'--visual-display-font':fontStack(design.displayFont)} as CSSProperties}>
          <div className="hero-copy">
            <p className="eyebrow">
              {ar ? design.heroEyebrowAr : design.heroEyebrowEn}
            </p>
            <h1 style={{fontSize:`clamp(48px,7vw,${design.heroHeadingSize}px)`}}><em>{ar ? settings.heroTitleAr : settings.heroTitleEn}</em></h1>
            <p>{ar ? settings.heroSubtitleAr : settings.heroSubtitleEn}</p>
            <div className="hero-actions">
              <Link className="btn light" href={`/${locale}/category/women`}>
                {ar ? "تسوقي النساء" : "SHOP WOMEN"}
              </Link>
              <Link className="btn outline" href={`/${locale}/category/men`}>
                {ar ? "تسوق الرجال" : "SHOP MEN"}
              </Link>
            </div>
          </div>
          <div className="hero-image" style={design.heroImage?{backgroundImage:`linear-gradient(rgba(0,0,0,${design.heroOverlay/100}),rgba(0,0,0,${design.heroOverlay/100})),url(${design.heroImage})`,backgroundPosition:design.heroImagePosition}:undefined}>
            <div className="giant-watermark">G</div>
            <span className="image-note">GIANT / KUWAIT / 2026</span>
          </div>
        </section>
        <section className="product-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{ar ? design.newInEyebrowAr : design.newInEyebrowEn}</p>
              <h2>{ar ? design.newInTitleAr : design.newInTitleEn}</h2>
            </div>
            <Link href={`/${locale}/category/new-arrivals`}>
              {ar ? "عرض الكل" : "VIEW ALL"} <span>→</span>
            </Link>
          </div>
          <div className="product-grid">
            {products.slice(0, 8).map((p) => (
              <ProductCard p={p} locale={locale} key={p.id} />
            ))}
          </div>
        </section>
        <section className={`brand-story visual-shape-${design.storyShape}`} style={{minHeight:design.storyMinHeight,color:design.storyTextColor,backgroundImage:design.storyImage?`linear-gradient(#0009,#0009),url(${design.storyImage})`:undefined,backgroundPosition:design.storyImagePosition,'--visual-display-font':fontStack(design.displayFont)} as CSSProperties}>
          <div className="story-mark">
            <Mark />
          </div>
          <div>
            <p className="eyebrow">{ar?design.storyCodeAr:design.storyCodeEn}</p>
            <h2 style={{fontSize:`clamp(42px,6vw,${design.storyHeadingSize}px)`}}>{ar ? design.storyTitleAr : design.storyTitleEn}</h2>
            <p>{ar?design.storyBodyAr:design.storyBodyEn}</p>
            <Link className="btn light" href={`/${locale}/pages/our-story`}>
              {ar ? "قصتنا" : "OUR STORY"}
            </Link>
          </div>
        </section>
        <section className="category-panels">
          <Link href={`/${locale}/category/women`}>
            <span>01</span>
            <h2>{ar ? design.womenLabelAr : design.womenLabelEn}</h2>
          </Link>
          <Link href={`/${locale}/category/men`}>
            <span>02</span>
            <h2>{ar ? design.menLabelAr : design.menLabelEn}</h2>
          </Link>
          <Link href={`/${locale}/category/accessories`}>
            <span>03</span>
            <h2>{ar ? design.accessoriesLabelAr : design.accessoriesLabelEn}</h2>
          </Link>
        </section>
      </main>
    </Shell>
  );
}
