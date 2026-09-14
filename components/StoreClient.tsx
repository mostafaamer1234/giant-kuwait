"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiHeart, FiMenu, FiShoppingBag, FiUser } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import type { Locale, Product } from "@/lib/catalog";
import { money } from "@/lib/catalog";

export type CartLine = { id: string; size: string; qty: number };
const cartKey = "giant-cart";
const defaultWebsiteDesign = {pageMaxWidth:1920,headerHeight:72,headerBackground:'#FFFFFF',headerTextColor:'#090909',announcementBackground:'#090909',announcementTextColor:'#FFFFFF',bodyBackground:'#FFFFFF',bodyTextColor:'#090909',buttonRadius:0,buttonStyle:'solid' as 'solid'|'outline',cardRadius:0,productImageRatio:'portrait' as 'portrait'|'square'|'tall',catalogHeroBackground:'#F7F5EF',catalogHeroTextColor:'#090909',catalogHeroHeight:260,catalogTaglineEn:'Performance engineered to move with you.',catalogTaglineAr:'أداء مصمم ليتحرك معك.',pdpGalleryHeight:720,pdpInfoBackground:'#FFFFFF',pdpTitleSize:64,footerBackground:'#090909',footerTextColor:'#FFFFFF',footerTitleEn:'MOVE BIG.',footerTitleAr:'تحرك بقوة.',footerNoteEn:'Performance clothing for Kuwait.',footerNoteAr:'ملابس أداء للكويت.',sectionSpacing:90};
export function useCart() {
  const [lines, setLines] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(cartKey) || "[]");
    } catch {
      return [];
    }
  });
  const save = (v: CartLine[]) => {
    setLines(v);
    localStorage.setItem(cartKey, JSON.stringify(v));
    window.dispatchEvent(new Event("giant-cart"));
  };
  return {
    lines,
    add: (id: string, size: string, quantity = 1) => {
      const qty = Math.max(1, Math.min(10, quantity));
      const hit = lines.find((x) => x.id === id && x.size === size);
      save(
        hit
          ? lines.map((x) =>
              x === hit ? { ...x, qty: Math.min(10, x.qty + qty) } : x,
            )
          : [...lines, { id, size, qty }],
      );
    },
    update: (id: string, size: string, qty: number) =>
      save(
        qty < 1
          ? lines.filter((x) => !(x.id === id && x.size === size))
          : lines.map((x) =>
              x.id === id && x.size === size
                ? { ...x, qty: Math.min(10, qty) }
                : x,
            ),
      ),
    clear: () => save([]),
  };
}
export function Mark() {
  return (
    <span className="mark" aria-hidden="true">
      <Image src="/giant-logo-on-white.jpg" alt="" width={416} height={281}/>
    </span>
  );
}
export function Shell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [siteSettings, setSiteSettings] = useState({
    wordmark: "GIANT",
    whatsappNumber: "96500000000",
    announcementEn: "SAME DAY DELIVERY IN KUWAIT · ORDER BEFORE 2 PM",
    announcementAr: "توصيل في نفس اليوم داخل الكويت · اطلب قبل ٢ ظهراً",
    accent: "#F0642B",
    ink: "#090909",
    ivory: "#F7F5EF",
    websiteDesign:defaultWebsiteDesign,
  });
  const [count, setCount] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      return (
        JSON.parse(localStorage.getItem(cartKey) || "[]") as CartLine[]
      ).reduce((a, x) => a + x.qty, 0);
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    const read = () => {
      try {
        setCount(
          (
            JSON.parse(localStorage.getItem(cartKey) || "[]") as CartLine[]
          ).reduce((a, x) => a + x.qty, 0),
        );
      } catch {}
    };
    window.addEventListener("giant-cart", read);
    return () => window.removeEventListener("giant-cart", read);
  }, []);
  useEffect(()=>{if(!menu)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';closeButtonRef.current?.focus();const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setMenu(false);menuButtonRef.current?.focus()}};window.addEventListener('keydown',close);return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',close)}},[menu]);
  useEffect(()=>{const code=new URLSearchParams(window.location.search).get('promo');if(!code)return;localStorage.setItem('giant-promo-code',code.toUpperCase());const key=`giant-promo-click:${code.toUpperCase()}`;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');void fetch('/api/v1/promotions/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,event:'click'})})},[]);
  useEffect(() => {
    let active = true;
    fetch("/api/v1/content/settings")
      .then((response) => response.json() as Promise<{data?:typeof siteSettings}>)
      .then((payload) => {
        if (!active || !payload.data) return;
        setSiteSettings(current=>({...current,...payload.data,websiteDesign:{...current.websiteDesign,...payload.data?.websiteDesign}}));
        document.documentElement.style.setProperty(
          "--accent",
          payload.data.accent,
        );
        document.documentElement.style.setProperty("--ink",payload.data.ink);
        document.documentElement.style.setProperty("--ivory",payload.data.ivory);
        const design={...defaultWebsiteDesign,...payload.data.websiteDesign};
        document.documentElement.style.setProperty('--site-max-width',`${design.pageMaxWidth}px`);document.documentElement.style.setProperty('--header-height',`${design.headerHeight}px`);document.documentElement.style.setProperty('--header-bg',design.headerBackground);document.documentElement.style.setProperty('--header-text',design.headerTextColor);document.documentElement.style.setProperty('--announcement-bg',design.announcementBackground);document.documentElement.style.setProperty('--announcement-text',design.announcementTextColor);document.documentElement.style.setProperty('--body-bg',design.bodyBackground);document.documentElement.style.setProperty('--body-text',design.bodyTextColor);document.documentElement.style.setProperty('--button-radius',`${design.buttonRadius}px`);document.documentElement.style.setProperty('--card-radius',`${design.cardRadius}px`);document.documentElement.style.setProperty('--product-ratio',design.productImageRatio==='square'?'1':design.productImageRatio==='tall'?'.68':'.8');document.documentElement.style.setProperty('--catalog-bg',design.catalogHeroBackground);document.documentElement.style.setProperty('--catalog-text',design.catalogHeroTextColor);document.documentElement.style.setProperty('--catalog-height',`${design.catalogHeroHeight}px`);document.documentElement.style.setProperty('--pdp-gallery-height',`${design.pdpGalleryHeight}px`);document.documentElement.style.setProperty('--pdp-info-bg',design.pdpInfoBackground);document.documentElement.style.setProperty('--pdp-title-size',`${design.pdpTitleSize}px`);document.documentElement.style.setProperty('--footer-bg',design.footerBackground);document.documentElement.style.setProperty('--footer-text',design.footerTextColor);document.documentElement.style.setProperty('--section-space',`${design.sectionSpacing}px`);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const t = locale === "ar";
  return (
    <>
      <a className="skip-link" href="#main-content">{t?"انتقل إلى المحتوى":"SKIP TO CONTENT"}</a>
      <div className="announcement">
        {t ? siteSettings.announcementAr : siteSettings.announcementEn}
      </div>
      <header className="site-header">
        <button
          ref={menuButtonRef}
          className="mobile-icon"
          aria-label="Open menu"
          aria-expanded={menu}
          aria-controls="mobile-navigation"
          type="button"
          onClick={() => setMenu(true)}
        >
          <FiMenu aria-hidden="true" />
        </button>
        <Link href={`/${locale}`} className="brand">
          <Mark />
          <b>{siteSettings.wordmark}</b>
        </Link>
        <nav aria-label="Main navigation">
          <Link href={`/${locale}/category/women`}>{t ? "نساء" : "WOMEN"}</Link>
          <Link href={`/${locale}/category/men`}>{t ? "رجال" : "MEN"}</Link>
          <Link href={`/${locale}/category/accessories`}>
            {t ? "إكسسوارات" : "ACCESSORIES"}
          </Link>
        </nav>
        <div className="header-actions">
          <Link className="search-button" href={`/${locale}/search`}>
            ⌕ <span>{t ? "ابحث عن منتج" : "Search products"}</span>
          </Link>
          <Link href={`/${locale}/account`} aria-label="Account">
            <FiUser className="account-icon" aria-hidden="true" />
          </Link>
          <Link
            className="cart-count"
            href={`/${locale}/cart`}
            aria-label={
              t
                ? `سلة التسوق، ${count} عناصر`
                : `Shopping cart, ${count} ${count === 1 ? "item" : "items"}`
            }
          >
            <FiShoppingBag aria-hidden="true" />
            {count > 0 && <sup>{count}</sup>}
          </Link>
          <Link
            className="locale-switch"
            href={`/${locale === "en" ? "ar" : "en"}`}
          >
            {locale === "en" ? "AR" : "EN"}
          </Link>
        </div>
      </header>
      {menu && (
        <div className="drawer-backdrop" onClick={() => setMenu(false)}>
          <aside id="mobile-navigation" className="nav-drawer" role="dialog" aria-modal="true" aria-label={t?"قائمة التنقل":"Navigation menu"} onClick={(e) => e.stopPropagation()}>
            <button ref={closeButtonRef} type="button" aria-label="Close menu" onClick={() => {setMenu(false);menuButtonRef.current?.focus()}}>
              ×
            </button>
            <Mark />
            <Link href={`/${locale}/category/new-arrivals`}>
              {t ? "وصل حديثاً" : "NEW ARRIVALS"}
            </Link>
            <Link href={`/${locale}/category/women`}>
              {t ? "نساء" : "WOMEN"}
            </Link>
            <Link href={`/${locale}/category/men`}>{t ? "رجال" : "MEN"}</Link>
            <Link href={`/${locale}/category/accessories`}>
              {t ? "إكسسوارات" : "ACCESSORIES"}
            </Link>
            <Link className="accent-link" href={`/${locale}/category/sale`}>
              {t ? "تخفيضات" : "SALE"}
            </Link>
            <Link className="drawer-language" href={`/${locale === "en" ? "ar" : "en"}`}>
              {t ? "ENGLISH" : "العربية"}
            </Link>
          </aside>
        </div>
      )}
      <div id="main-content" tabIndex={-1}>{children}</div>
      <Footer locale={locale} settings={siteSettings} />
      <a
        className="chat whatsapp-chat"
        href={`https://wa.me/${siteSettings.whatsappNumber.replace(/\D/g,"")}`}
        aria-label="WhatsApp"
      >
        <FaWhatsapp aria-hidden="true" focusable="false" />
      </a>
    </>
  );
}
export function ProductCard({ p, locale }: { p: Product; locale: Locale }) {
  return (
    <article className="product-card">
      <Link
        href={`/${locale}/product/${p.slug}`}
        className="product-image"
        style={{ backgroundImage: `url(${p.image})` }}
      >
        {p.badge && <span className="badge">{p.badge}</span>}
      </Link>
      <Link href={`/${locale}/product/${p.slug}`}>
        <h3>{locale === "ar" ? p.nameAr : p.name}</h3>
      </Link>
      <p>
        {p.fit} · {p.color}
      </p>
      <strong>{money(p.price, locale)}</strong>
      {p.compareAt && <del>{money(p.compareAt, locale)}</del>}
    </article>
  );
}
export function WishlistButton({product,locale}:{product:Product;locale:Locale}){
  const storageKey="giant-wishlist";
  const [saved,setSaved]=useState(()=>{if(typeof window==="undefined")return false;try{return(JSON.parse(localStorage.getItem(storageKey)||"[]") as string[]).includes(product.id)}catch{return false}});
  const toggle=()=>{let ids:string[]=[];try{ids=JSON.parse(localStorage.getItem(storageKey)||"[]") as string[]}catch{}const next=saved?ids.filter(id=>id!==product.id):Array.from(new Set([...ids,product.id]));localStorage.setItem(storageKey,JSON.stringify(next));setSaved(!saved)};
  return <button type="button" className={`pdp-wishlist${saved?" saved":""}`} aria-pressed={saved} aria-label={saved?(locale==="ar"?"إزالة من المفضلة":"Remove from wishlist"):(locale==="ar"?"إضافة إلى المفضلة":"Add to wishlist")} onClick={toggle}><FiHeart aria-hidden="true"/><span>{saved?(locale==="ar"?"محفوظ":"SAVED"):(locale==="ar"?"حفظ":"SAVE")}</span></button>
}
function Footer({ locale,settings }: { locale: Locale;settings:{websiteDesign?:{footerTitleEn:string;footerTitleAr:string;footerNoteEn:string;footerNoteAr:string}} }) {
  const t = locale === "ar";
  const footer=settings.websiteDesign||{footerTitleEn:'MOVE BIG.',footerTitleAr:'تحرك بقوة.',footerNoteEn:'Performance clothing for Kuwait.',footerNoteAr:'ملابس أداء للكويت.'};
  return (
    <footer>
      <div className="footer-brand">
        <Mark />
        <h2>
          {t?footer.footerTitleAr:footer.footerTitleEn}
        </h2>
        <p>
          {t?footer.footerNoteAr:footer.footerNoteEn}
        </p>
      </div>
      {[
        ["HELP", "FAQ", "Delivery", "Returns"],
        ["ABOUT", "Our story", "Stores", "Careers"],
        ["GUIDES", "Size guide", "Training edit", "Fabric care"],
      ].map((col) => (
        <div className="footer-col" key={col[0]}>
          <b>{col[0]}</b>
          {col.slice(1).map((x) => (
            <Link
              href={`/${locale}/pages/${x.toLowerCase().replaceAll(" ", "-")}`}
              key={x}
            >
              {x}
            </Link>
          ))}
        </div>
      ))}
    </footer>
  );
}
export function AddToCart({
  product,
  locale,
  assistantEnabled = true,
}: {
  product: Product;
  locale: Locale;
  assistantEnabled?: boolean;
}) {
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const cart = useCart();
  const ar = locale === "ar";
  useEffect(() => {
    const apply = (event: Event) => {
      const detail = (event as CustomEvent<{ productId: string; size: string }>)
        .detail;
      if (
        detail?.productId === product.id &&
        product.sizes.includes(detail.size)
      ) {
        setSize(detail.size);
        setMessage(
          ar
            ? `تم اختيار المقاس ${detail.size} بواسطة مرشد المقاس`
            : `Size ${detail.size} selected by the fit guide`,
        );
      }
    };
    window.addEventListener("giant-size-recommendation", apply);
    return () => window.removeEventListener("giant-size-recommendation", apply);
  }, [product.id, product.sizes, ar]);
  return (
    <div className="buy-box">
      <div className="size-row">
        <b>{ar ? "اختر المقاس" : "SELECT SIZE"}</b>
        <span className="size-actions">
          {assistantEnabled && (
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("giant-open-size-assistant"))
              }
            >
              {ar ? "اعثر على مقاسي" : "FIND MY SIZE"}
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("giant-open-size-guide"))
            }
          >
            {ar ? "دليل المقاسات" : "SIZE GUIDE"}
          </button>
        </span>
      </div>
      <div className="sizes">
        {product.sizes.map((s) => (
          <button
            type="button"
            className={size === s ? "active" : ""}
            aria-pressed={size === s}
            onClick={() => {
              setSize(s);
              setMessage("");
            }}
            key={s}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="quantity-row">
        <b>{ar ? "الكمية" : "QUANTITY"}</b>
        <div className="quantity-control">
          <button
            type="button"
            aria-label={ar ? "تقليل الكمية" : "Decrease quantity"}
            disabled={quantity === 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <input
            aria-label={ar ? "الكمية" : "Quantity"}
            inputMode="numeric"
            min="1"
            max="10"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.max(1, Math.min(10, Number(e.target.value) || 1)),
              )
            }
          />
          <button
            type="button"
            aria-label={ar ? "زيادة الكمية" : "Increase quantity"}
            disabled={quantity === 10}
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
          >
            +
          </button>
        </div>
      </div>
      <button
        className="add-button"
        onClick={() => {
          if (!size) {
            setMessage(ar ? "اختر مقاساً أولاً" : "Choose a size first");
            return;
          }
          cart.add(product.id, size, quantity);
          setMessage(
            ar
              ? `تمت إضافة ${quantity} إلى السلة`
              : `Added ${quantity} ${quantity === 1 ? "item" : "items"} to your bag`,
          );
        }}
      >
        {ar ? "أضف إلى السلة" : `ADD ${quantity} TO BAG`}
      </button>
      <p role="status" className="status-message">
        {message}
      </p>
    </div>
  );
}
export function CatalogControls({
  items,
  locale,
}: {
  items: Product[];
  locale: Locale;
}) {
  const [sort, setSort] = useState("featured");
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState("all");
  const shown = useMemo(() => {
    const x = items.filter(
      (p) =>
        (gender === "all" || p.category === gender) &&
        (p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.color.toLowerCase().includes(query.toLowerCase())),
    );
    return [...x].sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : sort === "newest"
            ? b.id.localeCompare(a.id)
            : 0,
    );
  }, [items, sort, query, gender]);
  return (
    <>
      <div className="catalog-tools">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            locale === "ar" ? "ابحث في المجموعة" : "Search this collection"
          }
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          aria-label="Filter category"
        >
          <option value="all">All</option>
          <option value="women">Women</option>
          <option value="men">Men</option>
          <option value="accessories">Accessories</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort products"
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>
      <p className="result-count">{shown.length} PRODUCTS</p>
      <div className="product-grid catalog-grid">
        {shown.map((p) => (
          <ProductCard p={p} locale={locale} key={p.id} />
        ))}
      </div>
    </>
  );
}
