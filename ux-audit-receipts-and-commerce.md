# GIANT receipts and commerce UX audit

Date: 2026-09-04
Mode: Combined UX and accessibility audit
Target: Local GIANT storefront and protected admin

## Audit scope

The audit followed the administrator from an empty receipt period to the full receipt list, multi-selection, and a combined print document. A representative small-screen storefront cart was also checked. Code-level review covered how products, content, orders, customers, promotions, settings, and receipts move between the admin store and storefront.

## User goal and accessibility target

Administrators need to locate, select, export, inspect, and print one or many receipts without losing context. Customers need obvious, reversible cart controls on small screens. Controls should remain keyboard-operable, labelled, and usable at narrow widths.

## Steps and evidence

1. **Open Receipts on the default period — needs recovery help in the original state.**
   Evidence: `output/ux-audit/01-receipts-before-desktop.png`. The empty Today view showed no next action beyond the period buttons.

2. **Switch to All time — usable but passive in the original state.**
   Evidence: `output/ux-audit/02-receipts-before-populated.png`. Rows had individual print links, but no selection, search, bulk print, export, or explicit View action.

3. **Select receipts — healthy after implementation.**
   Evidence: `output/ux-audit/06-receipts-coherent-selected.png`. Each row now has a named checkbox, the header checkbox supports select-all and mixed state, selected rows are highlighted, and a sticky action bar reports count and total.

4. **Perform bulk actions — healthy after implementation.**
   The action bar exposes Print selected, Export CSV, Copy numbers, Clear, and Open order when exactly one receipt is selected. Search narrows the current date range without discarding the range context.

5. **Print the selected receipts — healthy after implementation.**
   Evidence: `output/ux-audit/07-receipts-coherent-pdf.png`. The combined monochrome PDF includes only selected receipts and reconciled item, sales, cost, and profit totals.

6. **Use Receipts on a small phone — healthy after responsive correction.**
   Evidence: `output/ux-audit/04-receipts-selected-mobile.png`. The table reflows into compact receipt cards, bulk actions wrap into full-width controls, and the page has no document-level horizontal overflow at 390 px.

7. **Manage a cart item on a small phone — healthy after implementation.**
   Evidence: `output/ux-audit/08-storefront-cart-mobile.png`. Product image and title both return to the PDP, quantity controls have item-specific accessible names, the maximum is enforced, and a dedicated Remove action is available.

## Strengths

- Date presets, financial summary cards, direct order links, and low-cost monochrome PDFs were already clear.
- The store already used one server-side admin store for published catalog products and public settings.
- The cart count already announced its current quantity to assistive technology.

## UX and data risks found

- The original receipt list supported only one-at-a-time printing.
- Empty periods did not offer a direct path to the complete receipt archive.
- Persisted legacy demo orders could have totals but no line items, producing zero item counts and contradictory PDF totals.
- Admin mutations had no version check, so an old admin tab could overwrite a newer checkout/store snapshot.
- Admin-managed content titles and publish state were not used by public content pages.
- Cart imagery and titles were not direct return paths to product details, and removal was hidden inside quantity decrementing.

## Implemented opportunities

- Select one, several, all visible, or all receipts in the current filtered period.
- Search by order, customer, email, or mobile.
- Bulk print up to 100 selected receipts, export selected CSV, copy order numbers, clear selection, or open a sole selected order.
- Explicit empty-state recovery to All time and clear-search recovery.
- Reconciled legacy order lines against the order total so receipt item totals, net sales, cost, and profit agree.
- Customer order counts/spend and promotion uses are derived from linked orders; missing checkout customers are normalized into profiles.
- Published products, settings, and content pages read from the same admin store; admin writes now reject stale versions and reload the current snapshot.
- Admin auto-refreshes on window focus and every 60 seconds and shows the last synced time.
- Added skip-to-content, Escape-to-close and focus return for mobile navigation, explicit cart Remove, linked cart product imagery/title, and named quantity controls.

## Accessibility risks and evidence limits

- Screenshots and DOM checks confirm labels, checkbox states, status regions, 390 px reflow, and absence of page-level horizontal overflow.
- A full screen-reader announcement audit, browser zoom audit, real printer test, and payment-provider production test require their respective assistive technology, hardware, and live merchant accounts.
- The mobile navigation restores focus and handles Escape, but a full keyboard loop test should remain part of regression QA.

## Final result

The implemented receipts workflow is healthy for single and multi-receipt operations. The audited storefront cart is healthy at the tested narrow viewport. Data normalization and optimistic version checks materially reduce cross-surface inconsistency, with the remaining limits listed above.
