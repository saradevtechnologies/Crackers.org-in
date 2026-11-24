# Changelog

## Unreleased — Bulk buyers, OTP login, safer password reset

Run `supabase/migrations/0003_bulk_buyers_and_auth.sql` and follow **"Supabase dashboard setup for bulk buyers & OTP"** in the README before deploying.

### Added
- **Mobile OTP login** for customers (`/login`): +91 number → 6-digit SMS code → name on first login. Resend after 30 s, at most 3 resends per 10 minutes, with friendly wait times.
- **Sign-up chooser** (`/signup`): "Buying for home or family" (OTP) or "I own a crackers shop" (bulk application). The bulk minimum comes from settings.
- **Bulk buyers** (replace "wholesale"):
  - Public 3-step application `/bulk/apply`: draft saved on the device, documents uploaded through signed URLs to the private `bulk-docs` bucket, rate limits (3 per mobile and 10 per network per day), duplicate check, optional Cloudflare Turnstile, WhatsApp receipt.
  - Public status check `/bulk/status` (application number + mobile), and "apply again" after a rejection (`?resubmit=BLK-…`).
  - Admin review `/admin/bulk`: tabs, 10-minute document links, expired-licence badge, Approve (Supabase invite email, or reset email when the address already has a login), Resend invite (once per 2 min), Reject with preset reasons, Suspend / Reactivate, Approve renewal.
  - Bulk login `/login/bulk` that tells pending applicants where their application is.
  - Bulk prices: new `product_bulk_prices` table, readable only by active bulk buyers, the product's seller and admins. Shown on product cards and pages to bulk buyers only.
  - Estimate order-type choice (Bulk / Regular) with "Add ₹X more" progress; bulk checkout prefilled from the application with the GSTIN shown.
  - Bank transfer payment (NEFT/RTGS/IMPS): bank details with copy buttons, 10–22 character reference, optional receipt.
  - Licence renewal from *My account*; "Bulk prices are paused" banner when suspended, expired or under renewal.
  - `/admin/settings`: bulk minimum, bank details (account number entered twice), site URL.
- **Password flows:** `/auth/confirm` (email link landing), `/auth/link-expired`, `/auth/set-password` (8+ characters, common-password block, show/hide, live checklist), `/forgot-password` (same answer whether or not the email exists, 3 per hour), `/auth/reset-verify` with a **phone code for bulk buyers** (`step_up_otps`, sha256-hashed, 10 min, 5 tries, 30 s resend gap, 5 per hour). After a password change, other sessions are signed out and a WhatsApp alert is queued.
- 5 wrong passwords → 15-minute pause (not permanent) for email logins.
- **English / Tamil** wording in `src/lib/copy.ts` with `t()` and a header language toggle (cookie).
- **API routes for the mobile app:** `POST /api/bulk/apply`, `/api/bulk/finalize`, `/api/bulk/status` (public, CORS `*`), `/api/bulk/renewal-upload` and `/api/admin/bulk/approve` (bearer token).
- Admin payments: All / UPI / Bank transfer filter, BULK badge, bank-transfer confirm wording. Seller orders: BULK badge, buyer shop name and GSTIN.
- Seller product form, list and CSV import: **Bulk price** (CSV column `bulk_price`; `wholesale_price` is still accepted).
- Tests: `npm run test:sql` (migrations + 35 SQL checks on PGlite), `npm test` (step-up OTP rules).

### Changed
- `place_order(p_items, p_ship, p_order_type text default 'retail')` replaces the old boolean version.
- `submit_payment(p_order_id, p_ref, p_proof_path)`: the parameter is now `p_ref` (was `p_utr`). **Older app builds that call it with `p_utr` must be updated.**
- `handle_new_user()` ignores `account_type` in sign-up metadata and takes the phone from phone sign-ups.
- WhatsApp: `queue_message()` added; `queue_notification()` is now a wrapper. Neither can be called from the browser any more.
- Checkout prefills the phone from the login and no longer overwrites the profile phone.
- *My account*: phone is read-only; bulk buyers see shop, GSTIN, licence expiry, status and renewal.

### Removed
- Wholesale: `profiles.wholesale*`, `wholesale_status` type, `products.wholesale_price` / `wholesale_min_qty` (copied into `product_bulk_prices` first), `orders.is_wholesale` (→ `order_type = 'bulk'`), `request_wholesale`, `admin_set_wholesale`, `/admin/wholesale`, and the wholesale form on `/account`.
- Email + password sign-up for customers (`/signup` is now the chooser). Email login moved to `/login/email`.

### Security
- Bulk prices are no longer readable by anyone through the public `products` table.
- Bulk documents bucket has no browser upload policy; 8 MB and PDF/JPG/PNG limits are enforced by the bucket and on finalise.
- `find_user_by_email`, `queue_message` and `queue_notification` are service-role only.
