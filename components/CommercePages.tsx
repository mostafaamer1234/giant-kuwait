"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { money, type Locale, type Product } from "@/lib/catalog";
import { Mark,useCart } from "./StoreClient";
export function CartView({
  locale,
  products,
  freeShippingFils = 25000,
}: {
  locale: Locale;
  products: Product[];
  freeShippingFils?: number;
}) {
  const cart = useCart();
  const rows = cart.lines
    .map((l) => ({ ...l, product: products.find((p) => p.id === l.id)! }))
    .filter((x) => x.product);
  const subtotal = rows.reduce((a, x) => a + x.product.price * x.qty, 0);
  return (
    <main className="commerce-page">
      <div className="commerce-title">
        <p>GIANT / BAG</p>
        <h1>{locale === "ar" ? "سلة التسوق" : "YOUR BAG"}</h1>
      </div>
      {rows.length === 0 ? (
        <div className="empty-state">
          <span>G</span>
          <h2>{locale === "ar" ? "حقيبتك فارغة" : "YOUR BAG IS EMPTY"}</h2>
          <Link className="btn dark" href={`/${locale}/category/new-arrivals`}>
            {locale === "ar" ? "تسوق الآن" : "SHOP NEW IN"}
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section>
            {rows.map((x) => (
              <article className="cart-line" key={`${x.id}-${x.size}`}>
                <Link className="cart-line-image" href={`/${locale}/product/${x.product.slug}`} aria-label={`${locale==='ar'?x.product.nameAr:x.product.name} · ${x.size}`} style={{ backgroundImage: `url(${x.product.image})` }} />
                <div>
                  <Link href={`/${locale}/product/${x.product.slug}`}><h3>{locale === "ar" ? x.product.nameAr : x.product.name}</h3></Link>
                  <p>
                    {x.product.color} · {x.size}
                  </p>
                  <strong>{money(x.product.price, locale)}</strong>
                  <div className="qty">
                    <button
                      type="button"
                      aria-label={locale==='ar'?`تقليل كمية ${x.product.nameAr}`:`Decrease ${x.product.name} quantity`}
                      onClick={() => cart.update(x.id, x.size, x.qty - 1)}
                    >
                      −
                    </button>
                    <span>{x.qty}</span>
                    <button
                      type="button"
                      disabled={x.qty===10}
                      aria-label={locale==='ar'?`زيادة كمية ${x.product.nameAr}`:`Increase ${x.product.name} quantity`}
                      onClick={() => cart.update(x.id, x.size, x.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button className="cart-remove" type="button" onClick={()=>cart.update(x.id,x.size,0)}>{locale==='ar'?'إزالة':'REMOVE'}</button>
                </div>
              </article>
            ))}
          </section>
          <aside className="summary">
            <h2>{locale === "ar" ? "الملخص" : "SUMMARY"}</h2>
            <p>
              <span>Subtotal</span>
              <b>{money(subtotal, locale)}</b>
            </p>
            <p>
              <span>Delivery</span>
              <b>{subtotal >= freeShippingFils ? "FREE" : "KWD 2.000"}</b>
            </p>
            <div className="delivery-progress">
              <i
                style={{
                  width: `${Math.min(100, (subtotal / freeShippingFils) * 100)}%`,
                }}
              />
            </div>
            <small>
              {subtotal >= freeShippingFils
                ? "You unlocked free delivery."
                : `${money(freeShippingFils - subtotal, locale)} away from free delivery.`}
            </small>
            <Link className="add-button" href={`/${locale}/checkout`}>
              {locale === "ar" ? "الدفع" : "CHECKOUT"}
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
export function CheckoutView({ locale }: { locale: Locale }) {
  const cart = useCart();
  const [complete, setComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<"knet"|"stripe"|"cod">("knet");
  const [idempotencyKey,setIdempotencyKey]=useState("");
  const [promotionCode,setPromotionCode]=useState(()=>typeof window==="undefined"?"":localStorage.getItem("giant-promo-code")||"");
  const [payments,setPayments]=useState({myFatoorahEnabled:true,stripeEnabled:false,codEnabled:true,standardDeliveryFils:2000,sameDayDeliveryFils:3500,sameDayCutoff:"14:00",codFeeFils:0,reservationMinutes:30});
  useEffect(()=>{fetch("/api/v1/content/settings").then(async response=>await response.json() as {data?:typeof payments}).then(payload=>{if(!payload.data)return;setPayments(payload.data);if(!payload.data.myFatoorahEnabled)setMethod(payload.data.stripeEnabled?"stripe":"cod")}).catch(()=>{})},[]);
  if (complete)
    return (
      <main className="order-success">
        <span className="success-ring">G</span>
        <p>ORDER {orderNumber}</p>
        <h1>{locale === "ar" ? "تم استلام طلبك." : "ORDER RECEIVED."}</h1>
        <p>
          We sent your confirmation and will update you when your order moves.
        </p>
        <Link className="btn dark" href={`/${locale}`}>
          BACK TO GIANT
        </Link>
      </main>
    );
  return (
    <main className="checkout-page">
      <div className="checkout-head">
        <Link href={`/${locale}`} className="brand">
          <Mark />
          <b>GIANT</b>
        </Link>
        <p>SECURE CHECKOUT</p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          setCheckoutError("");
          const form = new FormData(e.currentTarget);
          try {
            const key=idempotencyKey||crypto.randomUUID();setIdempotencyKey(key);
            const endpoint=method==="stripe"?"/api/v1/payments/stripe/session":method==="knet"?"/api/v1/payments/myfatoorah/session":"/api/v1/orders";
            const response = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: form.get("email"),
                mobile: form.get("mobile"),
                firstName: form.get("firstName"),
                lastName: form.get("lastName"),
                area: form.get("area"),
                block: form.get("block"),
                street: form.get("street"),
                building: form.get("building"),
                floor: form.get("floor"),
                promotionCode: promotionCode||undefined,
                payment: method,
                locale,
                idempotencyKey:key,
                lines: cart.lines.map((line) => ({
                  id: line.id,
                  size: line.size,
                  qty: line.qty,
                })),
              }),
            });
            const payload = (await response.json()) as {data:{number:string;url?:string;sessionId?:string;scriptUrl?:string};message?:string};
            if (!response.ok)
              throw new Error(payload.message || "Order could not be created");
            if(method==="stripe"&&payload.data.url){window.location.assign(payload.data.url);return}
            if(method==="knet"&&payload.data.sessionId){window.location.assign(`/${locale}/checkout/myfatoorah?session_id=${encodeURIComponent(payload.data.sessionId)}`);return}
            setOrderNumber(payload.data.number);setComplete(true);cart.clear();
          } catch (error) {
            setCheckoutError(
              error instanceof Error
                ? error.message
                : "Order could not be created",
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <section>
          <p className="step">01 / CONTACT</p>
          <h2>YOUR DETAILS</h2>
          <div className="form-grid">
            <label>
              Email
              <input
                name="email"
                required
                type="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              Mobile
              <input name="mobile" required type="tel" placeholder="+965" />
            </label>
            <label>
              First name
              <input name="firstName" required />
            </label>
            <label>
              Last name
              <input name="lastName" required />
            </label>
          </div>
          <p className="step">02 / DELIVERY</p>
          <h2>KUWAIT ADDRESS</h2>
          <div className="form-grid">
            <label>
              Area
              <input name="area" required />
            </label>
            <label>
              Block
              <input name="block" required />
            </label>
            <label className="wide">
              Street
              <input name="street" required />
            </label>
            <label>
              Building
              <input name="building" required />
            </label>
            <label>
              Floor / apartment
              <input name="floor" />
            </label>
          </div>
          <div className="method-cards">
            <label>
              <input type="radio" name="delivery" defaultChecked />
              <span>
                <b>Standard delivery</b>
                <small>1–2 working days · {money(payments.standardDeliveryFils,locale)}</small>
              </span>
            </label>
            <label>
              <input type="radio" name="delivery" />
              <span>
                <b>Same-day delivery</b>
                <small>Order before {payments.sameDayCutoff} · {money(payments.sameDayDeliveryFils,locale)}</small>
              </span>
            </label>
          </div>
          <p className="step">03 / PAYMENT</p>
          <label className="checkout-promo">PROMO CODE<input value={promotionCode} onChange={event=>{const code=event.target.value.toUpperCase();setPromotionCode(code);if(code)localStorage.setItem('giant-promo-code',code);else localStorage.removeItem('giant-promo-code')}} placeholder="GIANT10"/></label>
          <h2>PAYMENT METHOD</h2>
          <div className="method-cards">
            {payments.myFatoorahEnabled&&<label>
              <input
                type="radio"
                name="payment"
                checked={method === "knet"}
                onChange={() => setMethod("knet")}
              />
              <span>
                <b>KNET / CARD / APPLE PAY</b>
                <small>Securely processed by MyFatoorah</small>
              </span>
            </label>}
            {payments.stripeEnabled&&<label>
              <input type="radio" name="payment" checked={method === "stripe"} onChange={() => setMethod("stripe")}/>
              <span><b>STRIPE CHECKOUT</b><small>Cards, eligible wallets and 3-D Secure</small></span>
            </label>}
            {payments.codEnabled&&<label>
              <input
                type="radio"
                name="payment"
                checked={method === "cod"}
                onChange={() => setMethod("cod")}
              />
              <span>
                <b>Cash on delivery</b>
                <small>Pay when your order arrives{payments.codFeeFils?` · ${money(payments.codFeeFils,locale)} fee`:""}</small>
              </span>
            </label>}
          </div>
          {checkoutError && (
            <p className="checkout-error" role="alert">
              {checkoutError}
            </p>
          )}
          <button className="add-button" type="submit" disabled={submitting}>
            {submitting
              ? "CREATING ORDER…"
              : method === "cod"
                ? "PLACE COD ORDER"
                : "CONTINUE TO SECURE PAYMENT"}
          </button>
        </section>
        <aside className="checkout-art">
          <span>G</span>
          <h2>
            MOVE
            <br />
            BIG.
          </h2>
          <p>
            {cart.lines.reduce((a, x) => a + x.qty, 0)} items reserved for {payments.reservationMinutes} minutes
          </p>
        </aside>
      </form>
    </main>
  );
}
export function AccountView({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  return (
    <main className="account-page" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="account-art">
        <span>G</span>
        <p>GIANT MEMBERS / KUWAIT</p>
      </div>
      <section>
        <p className="eyebrow">
          {mode === "login" ? "WELCOME BACK" : "JOIN THE MOVEMENT"}
        </p>
        <h1>{mode === "login" ? "MY ACCOUNT" : "CREATE ACCOUNT"}</h1>
        <p>
          Track orders, save your favourites and move through checkout faster.
        </p>
        <form>
          {mode === "register" && (
            <label>
              Full name
              <input required />
            </label>
          )}
          <label>
            Email address
            <input required type="email" />
          </label>
          <label>
            Password
            <input required type="password" />
          </label>
          <button className="add-button" type="button">
            {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
        </form>
        <button
          className="text-button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "NEW TO GIANT? CREATE AN ACCOUNT"
            : "ALREADY A MEMBER? SIGN IN"}
        </button>
      </section>
    </main>
  );
}
export function SearchView({
  locale,
  products,
}: {
  locale: Locale;
  products: Product[];
}) {
  const [q, setQ] = useState("");
  const result = useMemo(
    () =>
      products
        .filter((p) =>
          (p.name + " " + p.color + " " + p.fit)
            .toLowerCase()
            .includes(q.toLowerCase()),
        )
        .slice(0, 8),
    [q,products],
  );
  return (
    <main className="search-page">
      <p>GIANT / SEARCH</p>
      <div className="search-hero">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            locale === "ar" ? "ما الذي تبحث عنه؟" : "WHAT ARE YOU LOOKING FOR?"
          }
        />
        <span>⌕</span>
      </div>
      {q && (
        <>
          <p className="result-count">
            {result.length} RESULTS FOR “{q.toUpperCase()}”
          </p>
          <div className="search-results">
            {result.map((p) => (
              <Link key={p.id} href={`/${locale}/product/${p.slug}`}>
                <div style={{ backgroundImage: `url(${p.image})` }} />
                <span>
                  <b>{p.name}</b>
                  <small>
                    {p.fit} · {money(p.price, locale)}
                  </small>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
