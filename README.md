# earnvoy

A marketplace that connects travellers with spare luggage space to senders who need
something carried on the same route. Travellers and senders pay a small fee to post
and to unlock contact details; earnvoy only ever introduces people and takes no part
in transport, inspection, customs, or insurance.

This repo is a complete, deployable full-stack app:

- **backend/** - Node.js + Express + PostgreSQL (Prisma), JWT auth, email + SMS
  verification, Stripe (card) and Paynow (EcoCash/mobile money) payments, PDF
  receipts, audit logging, admin API.
- **frontend/** - React + Vite + Tailwind, installable PWA, bottom navigation and
  hidden footer on mobile, animated UI (framer-motion), searchable world-airport
  picker, Stripe Elements + EcoCash payment flow.

---

## 1. Prerequisites

- Node.js 20+
- A PostgreSQL database (local, or a hosted one - Railway/Render/Supabase/RDS all work)
- Accounts for the services you want live (all degrade gracefully to console logging
  in development if you leave them unconfigured):
  - [Stripe](https://dashboard.stripe.com/apikeys) - card payments
  - [Paynow](https://www.paynow.co.zw) - EcoCash / mobile money merchant account
  - An SMTP provider (Resend, SendGrid, Postmark, Mailgun, or Gmail app password) - email
  - Twilio (or another SMS provider) - phone OTP verification

## 2. Backend setup

```bash
cd backend
cp .env.example .env       # then fill in DATABASE_URL and any service keys
npm install
npx prisma migrate dev --name init
npm run seed                # creates the admin account + a fully-paid demo account
npm run dev                  # http://localhost:4000
```

### Demo credentials (created by `npm run seed`)

| Account | Email | Password | What's in it |
|---|---|---|---|
| Admin | admin@earnvoy.com | ChangeMe123! | Full admin dashboard access |
| Demo traveller | demo@earnvoy.com | EarnvoyDemo123! | Verified badge, a live paid listing, a matched/secured listing, and a payment receipt |
| Demo sender | demo-buyer@earnvoy.com | EarnvoyDemo123! | Verified badge, has unlocked the demo traveller's contact details, with its own receipt |

**Change or remove these before going live.** You can override the values with
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DEMO_EMAIL`, `DEMO_PASSWORD`, etc. as env vars
before running `npm run seed`.

### Wiring up real payments

- **Stripe**: set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `backend/.env`,
  and point a webhook endpoint at `POST /api/payments/stripe/webhook` for the
  `payment_intent.succeeded` and `payment_intent.payment_failed` events.
- **Paynow/EcoCash**: register a merchant account at paynow.co.zw, set
  `PAYNOW_INTEGRATION_ID` / `PAYNOW_INTEGRATION_KEY`, and set `PAYNOW_RESULT_URL`
  to `https://your-api-domain/api/payments/paynow/webhook`. Double-check field
  names against Paynow's current docs before going live - payment gateway APIs
  occasionally change.
- **Email**: any standard SMTP provider works - just fill in `SMTP_HOST` / `SMTP_PORT`
  / `SMTP_USER` / `SMTP_PASS`.
- **SMS/OTP**: install the Twilio SDK (`npm install twilio` inside `backend/`) and set
  the `TWILIO_*` env vars. Until you do, OTPs are printed to the server console so
  you can still test the verification flow locally.

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env        # point VITE_API_URL at your backend, add your Stripe publishable key
npm install
npm run dev                  # http://localhost:5173
```

## 4. One-command deploy with Docker

```bash
# from the repo root
cp backend/.env.example backend/.env   # fill in real values first
docker compose up --build
```

This brings up Postgres, the API (port 4000), and the frontend served by nginx
(port 5173), and runs pending Prisma migrations automatically on boot.

For a managed hosting route instead: deploy `backend/` to Railway/Render/Fly.io
with a Postgres add-on, and deploy `frontend/` to Vercel/Netlify/Cloudflare Pages
(set `VITE_API_URL` to your backend's public URL there).

## 5. What's implemented

- Registration requiring full legal name (never shown publicly), username, email,
  and phone; email link + SMS OTP verification; green "Verified" badge once both
  are confirmed.
- One combined login form for everyone - admins and regular users log in the same
  way, and the server decides what they can see based on their stored role.
- Searchable world-airport picker (type to filter by code, city, or country) and
  native calendar date pickers that are also directly typable.
- Live feed filterable by listing type, departure/destination airport, date, and
  item category.
- £1.75 listing fee (traveller or sender) and £1.75 contact-unlock fee, payable by
  Stripe (card) or Paynow (EcoCash/mobile money).
- Once a listing's fee is paid it's "Live" on the feed; once someone unlocks
  contact details it flips to "Secured" and is hidden from new buyers until the
  owner accepts or declines; declining (or no agreement being reached) simply
  reopens it as a fresh listing for others.
- Two-listings-per-30-days rate limit.
- Mandatory "no prohibited or illegal goods" certification before a sender's
  listing can be posted.
- Refund policy enforced in code: technical failure -> refund; changed your mind
  after unlock -> no refund; owner deletes before a decision -> automatic refund.
- PDF receipts emailed automatically and downloadable anytime from the dashboard.
- Full account self-service: change password, forgot-password email flow, delete
  account, view transaction history and receipts.
- Terms & disclaimer gate shown on login until the current version is accepted -
  Agree & continue, or Decline & close (logs the user out).
- Admin dashboard: analytics, user management (suspend/delete), listing removal,
  report moderation queue, and an audit-log viewer with CSV export for law
  enforcement requests.
- Installable PWA: manifest, service worker (offline app-shell caching, network
  stays fresh for `/api/*` calls), custom favicon/app icons.
- Mobile-first responsiveness: bottom navigation bar on mobile, footer hidden on
  mobile (the bottom nav owns that space instead), animated feed/hero/page
  transitions via framer-motion.

## 6. Notes and honest limitations

- I can't run or deploy this from this environment (no outbound network access),
  so this hasn't been through `npm install` + a live test pass here - please run
  it locally/in CI before shipping. I did do careful manual review and syntax
  checks on every file.
- The airport list in `frontend/src/data/airports.js` covers ~140 major world hubs,
  not the full ~9,000-airport IATA database. It's built so you can swap in a full
  dataset (e.g. from OurAirports) without touching the picker component.
- No real logo file was provided, so the current favicon/app icons and in-app
  logo are a placeholder wordmark. Drop your real logo files into
  `frontend/public/` (keeping the same filenames referenced in
  `frontend/index.html` and `manifest.webmanifest`) to replace them - happy to
  regenerate all the icon sizes here if you upload a source logo file.
- Paynow/EcoCash refunds have no public API - the code marks them refunded in the
  database, but you'll need to actually process the refund via the Paynow
  merchant dashboard or their support team.
