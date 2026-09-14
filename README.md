# GIANT Kuwait Commerce

A production-oriented bilingual activewear storefront and operations dashboard for Kuwait. It combines an English/Arabic customer experience, configurable catalog and content, size recommendations, Stripe and MyFatoorah integrations, receipt tooling, and a protected admin control panel.

Production: [giant-kw.com](https://giant-kw.com/en)

Admin: [giant-kw.com/admin](https://giant-kw.com/admin)

API contract: [giant-kw.com/openapi.json](https://giant-kw.com/openapi.json)

> The included catalog, sizing ranges, imagery, addresses, orders, and customers are demonstration data. Replace and validate them before processing real orders.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Admin dashboard](#admin-dashboard)
- [Sizing system](#sizing-system)
- [Payments](#payments)
- [Data and persistence](#data-and-persistence)
- [API](#api)
- [Testing](#testing)
- [Deployment](#deployment)
- [Production checklist](#production-checklist)
- [Repository map](#repository-map)

## Features

### Storefront

- English and Arabic routes under `/en` and `/ar`, including RTL presentation.
- Responsive homepage, categories, search, product detail, cart, checkout, account, and editorial pages.
- KWD prices formatted to three decimal places; API money values use integer fils.
- Product color variants, size and quantity controls, wishlist, recommendations, discounts, and stock-aware checkout.
- Mobile navigation, language switching, cart status, WhatsApp support, and accessible controls.
- Admin-configurable typography, colors, spacing, image proportions, homepage sections, header, catalog, PDP, and footer.

### Commerce operations

- Product, inventory, customer, promotion, content, order, and receipt management.
- Order and customer detail views with linked previews and operational status controls.
- Promotion attribution for clicks, purchases, revenue, discounts, net sales, estimated costs, and profit.
- Individual, combined, and separate-page receipt printing with date filters and bulk selection.
- Bilingual content and size-guide management.
- Audit records and optimistic version checks for admin writes.

### Payments

- Stripe Checkout sessions and signed Stripe webhooks.
- MyFatoorah v3 sessions, KNET/card/Apple Pay configuration, callbacks, and signed webhooks.
- Cash on delivery with a configurable fee.
- Server-side totals, idempotency keys, promotion validation, and stock revalidation.
- Payment methods remain unavailable until their server credentials and webhook secrets are configured.

### Fit recommendation

- Customers enter height and weight on the product page.
- The estimator derives an approximate measurement profile and compares it with the product’s published chart.
- Admin charts use conventional measurements: chest/bust, underbust, waist, hips, and inseam.
- Guides support category defaults, product overrides, fit/stretch metadata, bilingual instructions, versioning, and verification.
- Height-and-weight results are intentionally low confidence; direct body measurements are more accurate.

## Architecture

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Application | Next.js 16, React 19, TypeScript | Storefront, admin, REST handlers, server rendering |
| Validation | Zod | Request parsing and validation boundaries |
| Operations store | Private Vercel Blob | Catalog, inventory, orders, customers, content, settings, guides, audit data |
| Payments | Stripe SDK, MyFatoorah REST API | Hosted checkout and webhook reconciliation |
| AI extraction | OpenAI Agents SDK | Optional multilingual sizing-language extraction |
| Sizing authority | TypeScript calculator | Deterministic chart matching and measurement estimation |
| Tests | Vitest | Pricing, payment, analytics, and sizing behavior |
| Deployment | Vercel | Next.js functions, static assets, domains, environment configuration |

The active Vercel app persists operations through `lib/admin-store.ts`. The repository also contains an earlier Drizzle/D1 schema scaffold under `db/` and `drizzle/`; it is not the active production store unless separately connected.

## Requirements

- Node.js 22.13 or newer
- pnpm 10 recommended
- Vercel and a private Blob store for persistent admin data
- Provider accounts only for payment methods you enable
- An OpenAI API key only if optional agent extraction is enabled

## Local setup

```bash
git clone https://github.com/mostafaamer1234/giant-kuwait.git
cd giant-kuwait
pnpm install
cp .env.example .env.local
pnpm dev
```

Open:

- Storefront: `http://localhost:3000/en`
- Arabic: `http://localhost:3000/ar`
- Admin: `http://localhost:3000/admin`
- API document: `http://localhost:3000/openapi.json`

Without `BLOB_READ_WRITE_TOKEN`, admin data uses an in-memory fallback and resets when the development process restarts.

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env.local`, provider secrets, webhook secrets, or generated admin credentials.

### Core and admin

| Variable | Required | Description |
| --- | --- | --- |
| `PUBLIC_SITE_ORIGIN` | Production | Canonical origin, such as `https://giant-kw.com` |
| `SEASONAL_ACCENT` | No | Default seasonal accent color |
| `BLOB_READ_WRITE_TOKEN` | Production | Private Vercel Blob read/write token |
| `ADMIN_EMAIL` | Yes | Initial admin email |
| `ADMIN_USERNAME` | Yes | Initial admin username |
| `ADMIN_PASSWORD` | Yes | Strong, unique initial password |
| `ADMIN_SESSION_SECRET` | Yes | Long random session-signing secret |

The admin can update its username and password after sign-in. Environment credentials remain recovery/bootstrap values.

### OpenAI sizing support

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Optional | Server-only API key for agent-assisted extraction |
| `OPENAI_KEY_ENCRYPTION_SECRET` | Recommended | Separate secret for a key saved through admin |
| `OPENAI_SIZING_MODEL` | No | Extraction model; see `.env.example` |
| `NEXT_PUBLIC_SIZE_ASSISTANT_ENABLED` | No | Build-time emergency feature flag |

### Stripe

| Variable | Required when enabled | Description |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Yes | Stripe server secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |

Webhook: `https://your-domain.example/api/v1/webhooks/stripe`

### MyFatoorah

| Variable | Required when enabled | Description |
| --- | --- | --- |
| `MYFATOORAH_API_URL` | Yes | Sandbox or production base URL |
| `MYFATOORAH_API_TOKEN` | Yes | Provider API token |
| `MYFATOORAH_WEBHOOK_SECRET` | Yes | Webhook verification secret |

Webhook: `https://your-domain.example/api/v1/webhooks/myfatoorah`

Apple Pay and production KNET availability depend on provider approval and domain verification.

## Admin dashboard

The protected `/admin` dashboard includes:

- **Overview** — sales, products, customers, stock, recent orders, and health.
- **Products** — bilingual product data, price, cost, image URL/upload, status, and inventory.
- **Inventory** — stock adjustments for the Kuwait warehouse.
- **Orders** — fulfillment queue and full order details.
- **Customers** — profiles, spend, linked orders, previews, and details.
- **Promotions** — coupon configuration and attributed performance.
- **Receipts** — date filters, selection, bulk actions, and print/PDF workflows.
- **Payments** — provider readiness and payment controls.
- **Website editor** — responsive previews and storefront-template controls.
- **Content** — bilingual editorial pages and publishing.
- **Sizing guides** — conventional measurement charts by category or product.
- **Settings** — identity, support, delivery, checkout, SEO, AI, payments, and account controls.

Admin mutations include a store version. A stale write receives a conflict and must be reviewed against the newest data.

## Sizing system

`lib/sizing.ts` is the sizing authority:

1. Admins publish conventional body- or garment-measurement bands.
2. Products reference a guide family and can have an item-level override.
3. The storefront collects height and weight.
4. The engine estimates required chart measurements and finds the closest supported size.
5. Fit preference may move at most one adjacent size when metadata permits.
6. Results record the exact guide version.

Seeded `3.0.0` ranges are demonstration data. Validate them against the manufacturer’s pattern and grading specifications before launch.

## Payments

Provider readiness requires both enabled admin settings and valid server credentials. The application does not fabricate payment availability.

- Keep secret keys server-side.
- Never store raw card information.
- Treat verified webhooks and provider reconciliation as authoritative.
- Use separate sandbox and production credentials.
- Test success, cancellation, retry, duplicate webhook, and delayed webhook paths.
- Verify statement descriptors, refunds, and enabled methods in provider dashboards.

## Data and persistence

The private Blob object `giant/admin-store.json` is the operational store. Read-time normalization gives new fields safe defaults and migrates older unverified demo guides.

Persisted domains include catalog, inventory, orders, customers, promotions, content, sizing guides, storefront design, admin account metadata, and audit events. Configure backups or scheduled exports for production.

## API

The REST API is under `/api/v1`; the contract is `public/openapi.json`.

- `/api/v1/catalog/*` — catalog, categories, and size guides
- `/api/v1/content/*` — public settings and content
- `/api/v1/checkout/quote` — authoritative quote calculation
- `/api/v1/orders` — order workflows
- `/api/v1/payments/*` — payment sessions
- `/api/v1/webhooks/*` — provider callbacks
- `/api/v1/promotions/*` — attribution
- `/api/v1/size-assistant/*` — sizing turns
- `/api/v1/admin/*` — authenticated operations

API money amounts are integer fils: `1000` fils displays as `KWD 1.000`.

## Testing

```bash
pnpm typecheck   # TypeScript
pnpm lint        # ESLint
pnpm test        # deterministic unit tests
pnpm build       # production Next.js build
pnpm eval:agent  # live OpenAI evaluation; requires credentials
```

Before release, manually verify both locales at mobile and desktop widths, payment callbacks, admin persistence, receipt printing, product overrides, and webhooks.

## Deployment

1. Import the GitHub repository into Vercel.
2. Use pnpm and the default Next.js build command.
3. Create or connect a private Blob store.
4. Configure Preview and Production environment variables.
5. Deploy with sandbox payment credentials.
6. Configure provider webhooks against the generated domain.
7. Add the custom domain and complete DNS verification.
8. Replace sandbox credentials only after acceptance testing.

```bash
npx vercel@latest deploy .        # preview
npx vercel@latest deploy . --prod # production
```

## Production checklist

- [ ] Replace demo products, images, customers, orders, and contact details.
- [ ] Validate every size range with the manufacturer or pattern maker.
- [ ] Rotate admin, session, encryption, OpenAI, Blob, and payment secrets.
- [ ] Confirm English/Arabic copy, RTL, terms, privacy, delivery, and returns.
- [ ] Connect production payment accounts and verify webhooks.
- [ ] Test KNET, cards, Apple Pay (if enabled), COD, refunds, cancellations, and retries.
- [ ] Confirm inventory behavior during concurrent checkout.
- [ ] Configure backups, monitoring, error reporting, and PII-safe logs.
- [ ] Run accessibility, mobile-browser, performance, and security checks.
- [ ] Confirm the custom domain, SSL, and canonical origin.

## Repository map

```text
app/
  [locale]/                 Localized storefront routes
  admin/                    Protected operations routes
  api/v1/                   Public, payment, webhook, and admin APIs
components/                 Storefront and admin client components
lib/                        Catalog, store, auth, sizing, analytics, payments
db/ and drizzle/            Database schema scaffold and migrations
evals/                      OpenAI sizing extraction evaluations
public/                     Brand assets and OpenAPI document
```

## Security

Report security concerns privately to the project owner. Do not open public issues containing credentials, customer data, webhook payloads, or exploitable details.

## License and ownership

The source is publicly visible, but no open-source license is granted unless the owner adds one. The GIANT name, monogram, media, and commercial content may have separate usage restrictions.
