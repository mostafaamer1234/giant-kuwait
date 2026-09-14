# Design QA

## Required fidelity surfaces

- Header mark uses the supplied GIANT artwork, blends into the white header, and is visibly larger than the previous mark.
- Editorial story mark has no rectangular backing or decorative circle, preserves the supplied artwork's native ratio, and is not cropped at very narrow mobile widths.
- Mobile menu, account, cart, and language controls remain visible and correctly sized.
- Product listing cards do not show wishlist hearts.
- Product detail pages show a working wishlist control beside the product title.
- The PDP wishlist is a standalone heart with no surrounding border or box in both saved and unsaved states.
- Protected admin settings expose an OpenAI connection panel that accepts a replacement key without returning the current plaintext credential to the browser.
- Admin dashboard, detail-page navigation, and login branding reuse the supplied logo without a contrasting rectangular image background.
- Customer-facing English and Arabic routes do not introduce page-level horizontal overflow at 320 px or 360 px.

## Source evidence

- Header logo reference: `/Users/mostafa/Downloads/26bfc667-fa74-4005-9aef-57877fb131d8.jpg` (416 × 281 px).
- Reported narrow-screen story defect: `/Users/mostafa/Downloads/02333111-8d8f-4814-ae92-5bc174bef144.JPG` (738 × 1600 px, including browser chrome).
- Friend-reported recurrence: a 944 × 2048 mobile screenshot including browser chrome and annotation.
- The supplied logo bitmap is reused verbatim at `public/giant-logo-on-white.jpg`; no logo geometry was redrawn.

## Implementation captures

- `output/design-qa/home-header-320.png` — English homepage header; 320 × 568 configured viewport, 305 × 541 browser content capture.
- `output/design-qa/home-story-320.png` — English homepage editorial story; same viewport and capture density.
- `output/design-qa/pdp-controls-320.png` — Axis Training Tee product controls; same viewport and capture density.
- `output/design-qa/mobile-menu-320.png` — open mobile navigation; same viewport and capture density.
- `output/design-qa/home-ar-320.png` — Arabic homepage header; same viewport and capture density.
- `output/design-qa/logo-comparison.png` — combined reference/implementation comparison reviewed at original 1280 × 760 px.
- `output/design-qa/pdp-heart-borderless-357.png` — annotated PDP state recreated at a 357 × 1204 viewport; computed border is `0px none` and background is transparent.
- `output/design-qa/admin-openai-key-357.png` — protected OpenAI settings panel at the same narrow viewport.
- `output/design-qa/wishlist-comparison.png` — combined before/after visual comparison reviewed at original 900 × 720 px.
- `output/design-qa/admin-logo-357.png` — compact admin navigation at 357 × 1204; the white mark blends into the black navigation surface.
- `output/design-qa/admin-login-logo-357.png` — admin login at 357 × 1204; the black mark blends into the ivory surface.
- `output/design-qa/admin-logo-1440.png` — desktop admin dashboard at 1440 × 1000.
- `output/design-qa/admin-logo-comparison.png` — supplied source, dark-surface treatment, and light-surface treatment reviewed together at 1260 × 430.
- `output/design-qa/story-borderless-320.png` — corrected editorial story at 320 × 568; full outer arcs are visible and the circle has been removed.
- `output/design-qa/story-circle-comparison.png` — friend-reported failure and corrected 320 px implementation reviewed side by side at 1200 × 760.

## Comparison history

1. Initial inspection reproduced the black rectangular backing around the story logo and confirmed the compact header controls were undersized.
2. Replaced the generated mark with the supplied bitmap, adapted the same asset for dark surfaces, enlarged the header mark and icon controls, and captured the first 320 px implementation.
3. The first narrow-width audit exposed a separate overflow from the mobile category links (358 px content inside a 320 px viewport). The grid track, link minimum width, and heading wrapping were corrected.
4. Final side-by-side review confirmed that the header mark sits directly on white, the story mark is centered and rectangle-free, the product-card hearts are absent, and the PDP wishlist is aligned beside the title.
5. The annotated wishlist control was compared before and after at the same PDP state. Its visible square outline was removed while the 44 px target and orange saved state were retained.
6. The OpenAI admin panel was reviewed in the authenticated Settings → AI & features flow. It shows only connection state, source, and the final four characters; the replacement field is blank after loading.
7. The supplied logo was applied to all three admin placements. Side-by-side review confirmed no black or white rectangular backing remains visible and the original proportions are preserved.
8. A later external screenshot exposed the remaining root cause: square logo containers combined with `object-fit: cover` cropped the supplied 415 × 277 bitmap's outer arcs. Every logo placement now uses `object-fit: contain`, and its containers preserve the artwork's approximately 1.50:1 native ratio.
9. The oversized editorial circle and its reserved square whitespace were removed. The resulting borderless lockup was compared directly with the reported screenshot and retained clear spacing before the story copy.

## Functional and responsive verification

- Automated DOM width audit: `/en`, `/ar`, `/en/category/new-arrivals`, `/en/product/axis-training-tee-black`, `/en/cart`, and `/en/search` at 320 px; no page-level overflow after correction.
- Cross-check at 360 px: `/en`, `/ar`, and the PDP; menu, account, cart, and language controls are visible.
- Wishlist interaction: `aria-pressed` changes from `false` to `true` on the PDP.
- Wishlist presentation: computed border is `0px none` and computed background is transparent at 357 px.
- Product previews: zero wishlist controls detected in product-card DOM.
- OpenAI key control: authenticated status request renders a masked connection state; replacement and override removal require the current admin password.
- Admin logo responsive review: dashboard passed at 357 × 1204 and 1440 × 1000 with no document-level horizontal overflow; login passed at 357 × 1204.
- Permanent logo regression matrix: 280, 320, 360, 375, 393, 430, 768, and 1440 px widths. Every run reported `object-fit: contain`, a 0 px editorial border, no horizontal overflow, and an approximately 1.48:1 rendered logo ratio matching the decoded 415 × 277 source.
- Placement audit at 280 px: header, editorial story, and footer marks all preserve the full bitmap. The protected admin mark also resolves to `object-fit: contain`.
- Static verification: typecheck, lint, unit tests, and production build.

## Final result

final result: passed
