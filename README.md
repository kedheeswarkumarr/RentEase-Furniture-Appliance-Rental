# RentEase — Furniture & Appliance Rental Platform

RentEase is a college-project web app built with HTML, CSS, JavaScript, Node.js, Express and SQLite.

## Included
- Responsive storefront with Furniture/Appliances filters and search.
- Sample catalog with monthly rent, security deposit, tenure options and stock.
- Customer registration/login, rental requests, rental history and support requests.
- Admin dashboard for product inventory, rental statuses, support statuses and basic metrics.
- SQLite persistence, sample data and `/healthz` health endpoint.
- `render.yaml` plus deployment guide for an online demo.
- Requirement audit: `docs/PROJECT_REQUIREMENTS.md`.

## Run locally
Requires Node.js 20+.

```bash
npm install
npm start
```
Open `http://localhost:3000`. On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd install` and `npm.cmd start`, or double-click `RUN_RENTEASE.bat`.

Local demo admin credentials (change before use):
- Email: `admin@rentease.local`
- Password: `ChangeMe123!`

## Environment variables
- `PORT`: hosting port (usually injected by host)
- `DB_PATH`: optional SQLite file path; use a persistent disk path on a host
- `ADMIN_EMAIL`: admin email created at first startup if it does not exist
- `ADMIN_PASSWORD`: admin password used only when creating that account
- `SESSION_SECRET`: session signing secret; required in production (minimum 32 characters)
- `NODE_ENV=production`: enables production cookie settings and production configuration checks

Do not use the demo credentials or default local secret on a public deployment.

## Deploy online
See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). The included Render Blueprint uses a persistent disk, which generally requires a paid plan. Hosting account login, billing approval and final deployment must be completed by the project owner. A successful local run does not itself create a public URL.

## Known limitations
- Checkout submits a rental request only; there is no real payment gateway or multi-item cart.
- Delivery/pickup are not integrated with logistics partners; no pickup date or calendar view exists.
- No customer-side return/extension workflow, dispute/damage claims or service-area management.
- The default Express in-memory session store is suitable only for a small demo. Add a persistent session store, rate limiting, CSRF protection, backups, privacy/terms pages and a security review before accepting real customer data.
- Product images use external Unsplash URLs; replace them with images you have permission to use for a public commercial deployment.

## API overview
`/api/register`, `/api/login`, `/api/logout`, `/api/me`, `/api/products`, `/api/rentals`, `/api/support`, `/api/admin/summary`, `/api/admin/products`, `/api/admin/users`, `/api/admin/rentals/:id`, `/api/support/:id`.
