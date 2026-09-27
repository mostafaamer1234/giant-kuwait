"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {AdminControlCenter,PaymentModule} from "@/components/AdminControlCenter";
import {ReceiptModule} from "@/components/ReceiptModule";
import {SizingGuideManager} from "@/components/SizingGuideManager";
import {VisualSiteEditor} from "@/components/VisualSiteEditor";
import {MetaDashboard} from "@/components/MetaDashboard";
import type {
  AdminContent,
  AdminCustomer,
  AdminOrder,
  AdminPromotion,
  AdminSettings,
  AdminStore,
  ManagedProduct,
} from "@/lib/admin-store";
import {promotionMetrics} from "@/lib/commerce-analytics";

type Tab =
  | "Overview"
  | "Products"
  | "Inventory"
  | "Orders"
  | "Customers"
  | "Promotions"
  | "Receipts"
  | "Payments"
  | "Meta analytics"
  | "Website editor"
  | "Content"
  | "Sizing guides"
  | "Settings";
const tabs: Tab[] = [
  "Overview",
  "Products",
  "Inventory",
  "Orders",
  "Customers",
  "Promotions",
  "Receipts",
  "Payments",
  "Meta analytics",
  "Website editor",
  "Content",
  "Sizing guides",
  "Settings",
];
const kwd = (fils: number) =>
  new Intl.NumberFormat("en-KW", {
    style: "currency",
    currency: "KWD",
    minimumFractionDigits: 3,
  }).format(fils / 1000);

export function AdminConsole({
  initialStore,
  email,
  initialTab = "Overview",
}: {
  initialStore: AdminStore;
  email: string;
  initialTab?: Tab;
}) {
  const [store, setStore] = useState(initialStore);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<ManagedProduct | null>(null);
  async function refresh(silent=false){try{const response=await fetch('/api/v1/admin/store',{cache:'no-store'});const payload=await response.json() as {data?:AdminStore};if(response.status===401){window.location.assign('/admin/login');return}if(!response.ok||!payload.data)throw new Error('Refresh failed');setStore(payload.data);if(!silent)setNotice('Latest storefront and operations data loaded')}catch{if(!silent)setNotice('Refresh failed')}}
  useEffect(()=>{const onFocus=()=>void refresh(true);window.addEventListener('focus',onFocus);const timer=window.setInterval(()=>void refresh(true),60000);return()=>{window.removeEventListener('focus',onFocus);window.clearInterval(timer)}},[]);
  function selectTab(item:Tab){setTab(item);window.history.replaceState(null,'',`/admin?tab=${encodeURIComponent(item)}`)}
  async function mutate(body: unknown) {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/v1/admin/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...body as Record<string,unknown>,version:store.version}),
      });
      const payload = (await response.json()) as {data:AdminStore;message?:string};
      if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      if (response.status === 409&&payload.data) {
        setStore(payload.data);
        setNotice("Data changed in another session. The latest version is loaded; review and save again.");
        return payload.data;
      }
      if (!response.ok) throw new Error(payload.message || "Update failed");
      setStore(payload.data);
      setNotice("Saved to Vercel");
      return payload.data as AdminStore;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }
  const upsert = (collection: string, record: Record<string, unknown>) =>
    mutate({ action: "upsert", collection, record });
  const remove = (collection: string, id: string) => {
    if (window.confirm("Delete this record?"))
      void mutate({ action: "delete", collection, id });
  };
  const revenue = store.orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const lowStock = store.products.filter(
    (product) => product.stock < 10,
  ).length;
  return (
    <main className="admin-page">
      <aside>
        <div className="admin-brand">
          <Image src="/giant-logo-on-white.jpg" alt="GIANT" width={416} height={281}/>
          <b>GIANT / OPS</b>
        </div>
        {tabs.map((item) => (
          <button
            className={tab === item ? "active" : ""}
            onClick={() => selectTab(item)}
            key={item}
          >
            {item}
          </button>
        ))}
        <button
          className="admin-signout"
          onClick={async () => {
            await fetch("/api/v1/admin/session", { method: "DELETE" });
            window.location.assign("/admin/login");
          }}
        >
          Sign out
        </button>
      </aside>
      <section>
        <header>
          <div>
            <p>LIVE · VERCEL OPERATIONS</p>
            <h1>{tab.toUpperCase()}.</h1>
          </div>
          <div className="admin-header-actions"><button type="button" onClick={()=>void refresh()}>REFRESH DATA</button><div className="admin-user"><span>{email}</span><small>SYNCED {new Date(store.updatedAt).toLocaleTimeString('en-KW',{hour:'2-digit',minute:'2-digit'})}</small></div></div>
        </header>
        {notice && (
          <div
            className={`admin-notice ${notice.includes("failed") ? "error" : ""}`}
            role="status"
          >
            {notice}
          </div>
        )}
        {busy && <div className="admin-saving">SYNCING…</div>}
        {tab === "Overview" && (
          <>
            <div className="stats">
              {[
                ["Net sales", kwd(revenue), `${store.orders.length} orders`],
                [
                  "Published products",
                  String(
                    store.products.filter(
                      (product) => product.status === "published",
                    ).length,
                  ),
                  "Live catalog",
                ],
                [
                  "Customers",
                  String(store.customers.length),
                  "Managed records",
                ],
                [
                  "Low stock",
                  String(lowStock),
                  lowStock ? "Needs attention" : "Healthy",
                ],
              ].map((item) => (
                <article key={item[0]}>
                  <p>{item[0]}</p>
                  <h2>{item[1]}</h2>
                  <span>{item[2]}</span>
                </article>
              ))}
            </div>
            <div className="admin-grid">
              <article>
                <div className="admin-section-title">
                  <h2>RECENT ORDERS</h2>
                  <button onClick={() => setTab("Orders")}>MANAGE →</button>
                </div>
                {store.orders.slice(0, 7).map((order) => (
                  <div className="order-row" key={order.id}>
                    <PreviewLink href={`/admin/orders/${order.id}`} preview={<OrderPreview order={order} />}><b>{order.number}</b></PreviewLink>
                    <span>{order.customer}</span>
                    <span>{kwd(order.total)}</span>
                    <i>{order.status.toUpperCase()}</i>
                  </div>
                ))}
              </article>
              <article className="activity">
                <h2>STORE HEALTH</h2>
                <div className="activity-ring">
                  <span>{store.products.length}</span>
                </div>
                <p>Products under management</p>
                <hr />
                <b>Last synced</b>
                <span>{new Date(store.updatedAt).toLocaleString()}</span>
                <hr />
                <b>Store version</b>
                <span>v{store.version}</span>
              </article>
            </div>
          </>
        )}
        {tab === "Products" && (
          <section className="admin-module">
            <div className="admin-toolbar">
              <div>
                <p>CATALOG</p>
                <h2>{store.products.length} PRODUCTS</h2>
              </div>
              <button onClick={() => setEditing(newProduct())}>
                + ADD PRODUCT
              </button>
            </div>
            {editing && (
              <ProductEditor
                product={editing}
                onCancel={() => setEditing(null)}
                onSave={async (product) => {
                  await upsert(
                    "products",
                    product as unknown as Record<string, unknown>,
                  );
                  setEditing(null);
                }}
              />
            )}
            <div className="admin-table products-table">
              <div className="admin-table-head">
                <span>PRODUCT</span>
                <span>PRICE</span>
                <span>STOCK</span>
                <span>STATUS / ACTION</span>
                <span>ACTIONS</span>
              </div>
              {store.products.map((product) => (
                <div className="admin-table-row" key={product.id}>
                  <span className="product-cell">
                    <i style={{ backgroundImage: `url(${product.image})` }} />
                    <b>
                      {product.name}
                      <small>
                        {product.color} · {product.id}
                      </small>
                    </b>
                  </span>
                  <span>{kwd(product.price)}</span>
                  <span>{product.stock}</span>
                  <span>
                    <em className={`status ${product.status}`}>
                      {product.status}
                    </em>
                  </span>
                  <span className="row-actions">
                    <button onClick={() => setEditing(product)}>EDIT</button>
                    <button onClick={() => remove("products", product.id)}>
                      DELETE
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
        {tab === "Inventory" && (
          <section className="admin-module">
            <div className="admin-toolbar">
              <div>
                <p>KUWAIT WAREHOUSE</p>
                <h2>STOCK CONTROL</h2>
              </div>
              <span>
                {store.products.reduce(
                  (sum, product) => sum + product.stock,
                  0,
                )}{" "}
                UNITS
              </span>
            </div>
            <div className="admin-table">
              <div className="admin-table-head">
                <span>SKU</span>
                <span>PRODUCT</span>
                <span>AVAILABLE</span>
                <span>ADJUST</span>
              </div>
              {store.products.map((product) => (
                <InventoryRow
                  key={product.id}
                  product={product}
                  onSave={(record) =>
                    upsert(
                      "products",
                      record as unknown as Record<string, unknown>,
                    )
                  }
                />
              ))}
            </div>
          </section>
        )}
        {tab === "Orders" && (
          <section className="admin-module">
            <div className="admin-toolbar">
              <div>
                <p>FULFILLMENT</p>
                <h2>ORDER QUEUE</h2>
              </div>
              <span>{store.orders.length} ORDERS</span>
            </div>
            <div className="admin-table">
              <div className="admin-table-head">
                <span>ORDER</span>
                <span>CUSTOMER</span>
                <span>TOTAL</span>
                <span>STATUS</span>
              </div>
              {store.orders.map((order) => (
                <div className="admin-table-row" key={order.id}>
                  <span>
                    <PreviewLink href={`/admin/orders/${order.id}`} preview={<OrderPreview order={order} />}><b>{order.number}</b></PreviewLink>
                    <small>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </small>
                  </span>
                  <span>
                    <b>{order.customer}</b>
                    <small>{order.email}</small>
                  </span>
                  <span>{kwd(order.total)}</span>
                <span className="row-actions"><select value={order.status} onChange={(event)=>void upsert("orders",{...order,status:event.target.value})}>{["pending","processing","packed","shipped","delivered","cancelled"].map(status=><option key={status}>{status}</option>)}</select><button onClick={()=>remove('orders',order.id)}>DELETE</button></span>
                </div>
              ))}
            </div>
          </section>
        )}
        {tab === "Customers" && (
          <CustomerModule
            records={store.customers}
            orders={store.orders}
            onSave={(record) =>
              upsert("customers", record as unknown as Record<string, unknown>)
            }
            onDelete={(id) => remove("customers", id)}
          />
        )}
        {tab === "Promotions" && (
          <PromotionModule
            records={store.promotions}
            orders={store.orders}
            products={store.products}
            onSave={(record) =>
              upsert("promotions", record as unknown as Record<string, unknown>)
            }
            onDelete={(id) => remove("promotions", id)}
          />
        )}
        {tab === "Payments" && <PaymentModule settings={store.settings} />}
        {tab === "Meta analytics" && <MetaDashboard />}
        {tab === "Receipts" && (
          <ReceiptModule orders={store.orders} products={store.products}/>
        )}
        {tab === "Website editor" && (
          <VisualSiteEditor settings={store.settings} products={store.products} content={store.content} busy={busy} onSave={settings=>mutate({action:"settings",settings})} onOpenProducts={()=>selectTab('Products')} onOpenContent={()=>selectTab('Content')}/>
        )}
        {tab === "Content" && (
          <ContentModule
            records={store.content}
            onSave={(record) =>
              upsert("content", record as unknown as Record<string, unknown>)
            }
            onDelete={(id) => remove("content", id)}
          />
        )}
        {tab === "Sizing guides" && (
          <SizingGuideManager products={store.products} guides={store.sizingGuides} busy={busy} onSave={payload=>mutate({action:"sizing-guide",...payload})} onReset={productId=>mutate({action:"sizing-guide",scope:"reset-product",productId})}/>
        )}
        {tab === "Settings" && (
          <AdminControlCenter
            settings={store.settings}
            onSave={(settings) => mutate({ action: "settings", settings })}
            onReset={() => {
              if (
                window.confirm(
                  "Reset every admin record to the original demo data?",
                )
              )
                void mutate({ action: "reset" });
            }}
          />
        )}
      </section>
    </main>
  );
}

function newProduct(): ManagedProduct {
  return {
    id: crypto.randomUUID(),
    slug: "new-product-black",
    name: "New product",
    nameAr: "منتج جديد",
    category: "men",
    fit: "Regular fit",
    color: "Black",
    price: 15000,
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85",
    ],
    imageAlt: "GIANT new product",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    bundles: [],
    description: "Describe this product.",
    sizeGuideId: "men-tops",
    fitProfile: "regular",
    stretchLevel: "medium",
    heightRule: "none",
    stock: 0,
    status: "draft",
  };
}
function ProductEditor({
  product,
  onCancel,
  onSave,
}: {
  product: ManagedProduct;
  onCancel: () => void;
  onSave: (product: ManagedProduct) => void;
}) {
  const [value, setValue] = useState(product);
  const [uploading,setUploading]=useState(false);
  const [uploadMessage,setUploadMessage]=useState("");
  const field = (key: keyof ManagedProduct, next: unknown) =>
    setValue((current) => ({ ...current, [key]: next }));
  const images=Array.from(new Set([...(value.images||[]),value.image].filter(Boolean)));
  function setImages(next:string[]){const clean=Array.from(new Set(next.map(item=>item.trim()).filter(Boolean)));setValue(current=>({...current,images:clean,image:clean[0]||''}))}
  return (
    <form
      className="record-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...value,
          image: images[0]||value.image,
          images,
          bundles: (value.bundles||[]).filter(bundle=>bundle.quantity>1&&bundle.price>=0).sort((a,b)=>a.quantity-b.quantity),
          slug:
            value.slug || value.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        });
      }}
    >
      <div>
        <p>PRODUCT EDITOR</p>
        <h2>{product.id.startsWith("P") ? "EDIT PRODUCT" : "NEW PRODUCT"}</h2>
      </div>
      <label>
        Name
        <input
          value={value.name}
          onChange={(event) => field("name", event.target.value)}
          required
        />
      </label>
      <label>
        Arabic name
        <input
          value={value.nameAr}
          onChange={(event) => field("nameAr", event.target.value)}
          required
        />
      </label>
      <label>
        Slug
        <input
          value={value.slug}
          onChange={(event) => field("slug", event.target.value)}
          required
        />
      </label>
      <label>
        Category
        <select
          value={value.category}
          onChange={(event) => field("category", event.target.value)}
        >
          <option>women</option>
          <option>men</option>
          <option>accessories</option>
        </select>
      </label>
      <label>
        Price (fils)
        <input
          type="number"
          value={value.price}
          onChange={(event) => field("price", Number(event.target.value))}
        />
      </label>
      <label>
        Unit cost (fils)
        <input type="number" min="0" value={value.cost??0} onChange={(event)=>field("cost",Number(event.target.value))}/>
      </label>
      <label>
        Stock
        <input
          type="number"
          value={value.stock}
          onChange={(event) => field("stock", Number(event.target.value))}
        />
      </label>
      <label>
        Status
        <select
          value={value.status}
          onChange={(event) => field("status", event.target.value)}
        >
          <option>published</option>
          <option>draft</option>
          <option>archived</option>
        </select>
      </label>
      <label className="wide">
        Image URLs (one per line)
        <textarea
          value={images.join("\n")}
          onChange={(event) => setImages(event.target.value.split("\n"))}
          placeholder="https://…"
        />
      </label>
      <label className="product-upload">
        Upload product images
        <input multiple type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={async event=>{const files=Array.from(event.target.files||[]);if(!files.length)return;setUploading(true);setUploadMessage(`Uploading 0 / ${files.length}…`);const uploaded:string[]=[];try{for(let index=0;index<files.length;index++){const body=new FormData();body.append('file',files[index]);const response=await fetch('/api/v1/admin/media',{method:'POST',body});const payload=await response.json() as {data?:{url:string};message?:string};if(!response.ok||!payload.data)throw new Error(payload.message||`Upload failed for ${files[index].name}`);uploaded.push(payload.data.url);setUploadMessage(`Uploading ${index+1} / ${files.length}…`)}setImages([...images,...uploaded]);setUploadMessage(`${uploaded.length} image${uploaded.length===1?'':'s'} uploaded.`)}catch(reason){if(uploaded.length)setImages([...images,...uploaded]);setUploadMessage(reason instanceof Error?reason.message:'Upload failed')}finally{setUploading(false);event.target.value=''}}}/>
        <small>{uploadMessage||'Select any number of JPEG, PNG, WebP or AVIF files · maximum 6 MB each'}</small>
      </label>
      <div className="product-image-manager wide">
        {images.map((image,index)=><article key={image}><div style={{backgroundImage:`url(${image})`}} aria-label={`Product image ${index+1}`}/><span>{index===0?'PRIMARY':`IMAGE ${index+1}`}</span><button type="button" disabled={index===0} onClick={()=>setImages([image,...images.filter(item=>item!==image)])}>MAKE PRIMARY</button><button type="button" onClick={()=>setImages(images.filter(item=>item!==image))}>REMOVE</button></article>)}
        {!images.length&&<p>Add at least one product image URL or upload a file.</p>}
      </div>
      <fieldset className="bundle-editor wide">
        <legend>MULTI-BUY PACKAGES</legend>
        <p>Set the total package price in fils. Example: quantity 2 at 10,000 fils means two items cost KWD 10.000 total.</p>
        {(value.bundles||[]).map((bundle,index)=><div key={bundle.id}><input aria-label="Package label" value={bundle.label} placeholder="2-pack" onChange={event=>field('bundles',(value.bundles||[]).map((item,itemIndex)=>itemIndex===index?{...item,label:event.target.value}:item))}/><label>Quantity<input type="number" min="2" value={bundle.quantity} onChange={event=>field('bundles',(value.bundles||[]).map((item,itemIndex)=>itemIndex===index?{...item,quantity:Math.max(2,Number(event.target.value))}:item))}/></label><label>Total price (fils)<input type="number" min="0" value={bundle.price} onChange={event=>field('bundles',(value.bundles||[]).map((item,itemIndex)=>itemIndex===index?{...item,price:Math.max(0,Number(event.target.value))}:item))}/></label><button type="button" onClick={()=>field('bundles',(value.bundles||[]).filter((_,itemIndex)=>itemIndex!==index))}>REMOVE</button></div>)}
        <button type="button" onClick={()=>field('bundles',[...(value.bundles||[]),{id:crypto.randomUUID(),label:`${(value.bundles?.length||0)+2}-pack`,quantity:(value.bundles?.length||0)+2,price:value.price*((value.bundles?.length||0)+2)}])}>+ ADD PACKAGE</button>
      </fieldset>
      <label className="wide">
        Description
        <textarea
          value={value.description}
          onChange={(event) => field("description", event.target.value)}
        />
      </label>
      <div className="editor-actions">
        <button type="button" onClick={onCancel}>
          CANCEL
        </button>
        <button>SAVE PRODUCT</button>
      </div>
    </form>
  );
}
function InventoryRow({
  product,
  onSave,
}: {
  product: ManagedProduct;
  onSave: (product: ManagedProduct) => void;
}) {
  const [stock, setStock] = useState(product.stock);
  return (
    <div className="admin-table-row">
      <span>{product.id}</span>
      <span>
        <b>{product.name}</b>
        <small>{product.color}</small>
      </span>
      <em className={`stock ${stock < 10 ? "low" : ""}`}>{stock}</em>
      <span className="stock-control">
        <button onClick={() => setStock(Math.max(0, stock - 1))}>−</button>
        <input
          type="number"
          value={stock}
          onChange={(event) =>
            setStock(Math.max(0, Number(event.target.value)))
          }
        />
        <button onClick={() => setStock(stock + 1)}>+</button>
        <button onClick={() => onSave({ ...product, stock })}>SAVE</button>
      </span>
    </div>
  );
}
function CustomerModule({
  records,
  orders,
  onSave,
  onDelete,
}: {
  records: AdminCustomer[];
  orders: AdminOrder[];
  onSave: (record: AdminCustomer) => void;
  onDelete: (id: string) => void;
}) {
  const blank = {
    id: "",
    name: "",
    email: "",
    mobile: "",
    orders: 0,
    spent: 0,
  };
  const [value, setValue] = useState<AdminCustomer>(blank);
  return (
    <section className="admin-module">
      <div className="admin-toolbar">
        <div>
          <p>CRM</p>
          <h2>CUSTOMERS</h2>
        </div>
        <span>{records.length} PROFILES</span>
      </div>
      <form
        className="compact-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ ...value, id: value.id || crypto.randomUUID() });
          setValue(blank);
        }}
      >
        <input
          placeholder="Full name"
          value={value.name}
          onChange={(e) => setValue({ ...value, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={value.email}
          onChange={(e) => setValue({ ...value, email: e.target.value })}
          required
        />
        <input
          placeholder="Mobile"
          value={value.mobile}
          onChange={(e) => setValue({ ...value, mobile: e.target.value })}
        />
        <button>{value.id ? "UPDATE" : "ADD CUSTOMER"}</button>
      </form>
      <div className="admin-table">
        {records.map((record) => {
          const customerOrders = orders.filter(order => order.email.toLowerCase() === record.email.toLowerCase() || order.customer.toLowerCase() === record.name.toLowerCase());
          const orderCount = Math.max(record.orders, customerOrders.length);
          return <div className="admin-table-row" key={record.id}>
            <span>
              <PreviewLink href={`/admin/customers/${record.id}`} preview={<CustomerPreview customer={record} orders={customerOrders} />}><b>{record.name}</b></PreviewLink>
              <small>{record.email}</small>
            </span>
            <span>{record.mobile}</span>
            <span>
              <PreviewLink href={`/admin/customers/${record.id}#orders`} preview={<OrderListPreview orders={customerOrders} fallbackCount={orderCount} />}>
                <b className="admin-text-link">{orderCount} {orderCount === 1 ? "order" : "orders"}</b>
              </PreviewLink>
            </span>
            <span>{kwd(record.spent)}</span>
            <span className="row-actions">
              <button onClick={() => setValue(record)}>EDIT</button>
              <button onClick={() => onDelete(record.id)}>DELETE</button>
            </span>
          </div>;
        })}
      </div>
    </section>
  );
}
function PromotionModule({
  records,
  orders,
  products,
  onSave,
  onDelete,
}: {
  records: AdminPromotion[];
  orders: AdminOrder[];
  products: ManagedProduct[];
  onSave: (record: AdminPromotion) => void;
  onDelete: (id: string) => void;
}) {
  const blank = { id: "", name: "", code: "", discount: 10, active: true };
  const [value, setValue] = useState<AdminPromotion>(blank);
  return (
    <section className="admin-module">
      <div className="admin-toolbar">
        <div>
          <p>MERCHANDISING</p>
          <h2>PROMOTIONS</h2>
        </div>
      </div>
      <form
        className="compact-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ ...value, id: value.id || crypto.randomUUID() });
          setValue(blank);
        }}
      >
        <input
          placeholder="Campaign name"
          value={value.name}
          onChange={(e) => setValue({ ...value, name: e.target.value })}
          required
        />
        <input
          placeholder="CODE"
          value={value.code}
          onChange={(e) =>
            setValue({ ...value, code: e.target.value.toUpperCase() })
          }
        />
        <input
          type="number"
          placeholder="Discount %"
          value={value.discount}
          onChange={(e) =>
            setValue({ ...value, discount: Number(e.target.value) })
          }
        />
        <label className="check">
          <input
            type="checkbox"
            checked={value.active}
            onChange={(e) => setValue({ ...value, active: e.target.checked })}
          />{" "}
          Active
        </label>
        <button>{value.id ? "UPDATE" : "ADD PROMOTION"}</button>
      </form>
      <div className="admin-table">
        {records.map((record) => {const metrics=promotionMetrics(record,orders,products);return (
          <div className="admin-table-row" key={record.id}>
            <span>
              <PreviewLink href={`/admin/promotions/${record.id}`} preview={<PromotionPreview promotion={record} />}><b>{record.name}</b></PreviewLink>
              <small>{record.code}</small>
            </span>
            <span><b>{metrics.clicks} clicks</b><small>{(metrics.conversionRate*100).toFixed(1)}% conversion</small></span>
            <span><b>{metrics.purchases} purchases</b><small>{kwd(metrics.netSales)} net sales</small></span>
            <em className={`status ${record.active ? "published" : "draft"}`}>
              {record.active ? "ACTIVE" : "PAUSED"}
            </em>
            <span className="row-actions">
              <button onClick={() => setValue(record)}>EDIT</button>
              <button
                onClick={() => onSave({ ...record, active: !record.active })}
              >
                {record.active ? "PAUSE" : "ENABLE"}
              </button>
              <button onClick={() => onDelete(record.id)}>DELETE</button>
            </span>
          </div>
        )})}
      </div>
    </section>
  );
}

function PreviewLink({href,preview,children}:{href:string;preview:React.ReactNode;children:React.ReactNode}) {
  return <span className="admin-preview-link">
    <Link href={href}>{children}</Link>
    <span className="admin-hover-card" role="tooltip">{preview}<Link className="hover-open" href={href}>OPEN FULL DETAILS →</Link></span>
  </span>;
}
function OrderPreview({order}:{order:AdminOrder}) {
  return <><small>ORDER PREVIEW</small><strong>{order.number}</strong><dl><div><dt>Customer</dt><dd>{order.customer}</dd></div><div><dt>Total</dt><dd>{kwd(order.total)}</dd></div><div><dt>Status</dt><dd>{order.status}</dd></div><div><dt>Placed</dt><dd>{new Date(order.createdAt).toLocaleDateString()}</dd></div></dl></>;
}
function CustomerPreview({customer,orders}:{customer:AdminCustomer;orders:AdminOrder[]}) {
  return <><small>CUSTOMER PREVIEW</small><strong>{customer.name}</strong><span>{customer.email}</span><span>{customer.mobile || "No mobile"}</span><dl><div><dt>Lifetime spend</dt><dd>{kwd(customer.spent)}</dd></div><div><dt>Orders</dt><dd>{Math.max(customer.orders,orders.length)}</dd></div></dl>{orders[0]&&<span>Latest: {orders[0].number}</span>}</>;
}
function OrderListPreview({orders,fallbackCount}:{orders:AdminOrder[];fallbackCount:number}) {
  return <><small>ORDER HISTORY</small><strong>{fallbackCount} {fallbackCount===1?'ORDER':'ORDERS'}</strong>{orders.length?orders.slice(0,4).map(order=><Link className="preview-order-link" href={`/admin/orders/${order.id}`} key={order.id}><span>{order.number}</span><b>{kwd(order.total)}</b></Link>):<span>Historical order details are not linked to this imported profile.</span>}</>;
}
function PromotionPreview({promotion}:{promotion:AdminPromotion}) {
  return <><small>PROMOTION PREVIEW</small><strong>{promotion.name}</strong><dl><div><dt>Code</dt><dd>{promotion.code || "Automatic"}</dd></div><div><dt>Discount</dt><dd>{promotion.discount ? `${promotion.discount}%` : "Free delivery"}</dd></div><div><dt>Status</dt><dd>{promotion.active ? "Active" : "Paused"}</dd></div><div><dt>Uses</dt><dd>{promotion.uses ?? 0}</dd></div></dl></>;
}
function ContentModule({
  records,
  onSave,
  onDelete,
}: {
  records: AdminContent[];
  onSave: (record: AdminContent) => void;
  onDelete: (id: string) => void;
}) {
  const blank = {
    id: "",
    slug: "",
    titleEn: "",
    titleAr: "",
    bodyEn: "",
    bodyAr: "",
    status: "draft" as const,
    updatedAt: "",
  };
  const [value, setValue] = useState<AdminContent>(blank);
  return (
    <section className="admin-module">
      <div className="admin-toolbar">
        <div>
          <p>EDITORIAL CMS</p>
          <h2>CONTENT PAGES</h2>
        </div>
      </div>
      <form
        className="compact-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            ...value,
            id: value.id || crypto.randomUUID(),
            updatedAt: new Date().toISOString(),
          });
          setValue(blank);
        }}
      >
        <input
          placeholder="Slug"
          value={value.slug}
          onChange={(e) => setValue({ ...value, slug: e.target.value })}
          required
        />
        <input
          placeholder="English title"
          value={value.titleEn}
          onChange={(e) => setValue({ ...value, titleEn: e.target.value })}
          required
        />
        <input
          placeholder="Arabic title"
          value={value.titleAr}
          onChange={(e) => setValue({ ...value, titleAr: e.target.value })}
          required
        />
        <textarea className="wide" placeholder="English page content" value={value.bodyEn||""} onChange={(e)=>setValue({...value,bodyEn:e.target.value})}/>
        <textarea className="wide" dir="rtl" placeholder="محتوى الصفحة بالعربية" value={value.bodyAr||""} onChange={(e)=>setValue({...value,bodyAr:e.target.value})}/>
        <select
          value={value.status}
          onChange={(e) =>
            setValue({
              ...value,
              status: e.target.value as AdminContent["status"],
            })
          }
        >
          <option>draft</option>
          <option>published</option>
        </select>
        <button>{value.id ? "UPDATE" : "ADD PAGE"}</button>
      </form>
      <div className="admin-table">
        {records.map((record) => (
          <div className="admin-table-row" key={record.id}>
            <span>
              <b>{record.titleEn}</b>
              <small>/{record.slug}</small>
            </span>
            <span>{record.titleAr}</span>
            <em className={`status ${record.status}`}>{record.status}</em>
            <span>{new Date(record.updatedAt).toLocaleDateString()}</span>
            <span className="row-actions">
              <button onClick={() => setValue(record)}>EDIT</button>
              <button onClick={() => onDelete(record.id)}>DELETE</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
// Retained for backwards-compatible embedded admin snapshots.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SettingsModule({
  settings,
  onSave,
  onReset,
}: {
  settings: AdminSettings;
  onSave: (settings: AdminSettings) => void;
  onReset: () => void;
}) {
  const [value, setValue] = useState(settings);
  return (
    <section className="admin-module settings-module">
      <div className="admin-toolbar">
        <div>
          <p>SITE CONFIGURATION</p>
          <h2>STORE SETTINGS</h2>
        </div>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(value);
        }}
      >
        <label>
          Seasonal accent
          <input
            type="color"
            value={value.accent}
            onChange={(e) => setValue({ ...value, accent: e.target.value })}
          />
          <input
            value={value.accent}
            onChange={(e) => setValue({ ...value, accent: e.target.value })}
          />
        </label>
        <label>
          English announcement
          <input
            value={value.announcementEn}
            onChange={(e) =>
              setValue({ ...value, announcementEn: e.target.value })
            }
          />
        </label>
        <label>
          Arabic announcement
          <input
            value={value.announcementAr}
            onChange={(e) =>
              setValue({ ...value, announcementAr: e.target.value })
            }
          />
        </label>
        <label>
          Free delivery threshold (fils)
          <input
            type="number"
            value={value.freeShippingFils}
            onChange={(e) =>
              setValue({ ...value, freeShippingFils: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Same-day cutoff
          <input
            type="time"
            value={value.sameDayCutoff}
            onChange={(e) =>
              setValue({ ...value, sameDayCutoff: e.target.value })
            }
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={value.codEnabled}
            onChange={(e) =>
              setValue({ ...value, codEnabled: e.target.checked })
            }
          />{" "}
          Cash on delivery enabled
        </label>
        <button>SAVE SETTINGS</button>
        <button type="button" className="danger" onClick={onReset}>
          RESET DEMO DATA
        </button>
      </form>
    </section>
  );
}
