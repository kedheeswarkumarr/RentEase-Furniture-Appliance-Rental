# RentEase — Furniture & Appliance Rental Platform

A responsive rental storefront with a Node.js + Express API and SQLite database. Built to match the supplied Unified Mentor project requirements.

## Features

- Responsive storefront, search and Furniture / Appliances filters
- Product cards, rental pricing, security deposits and 1 / 3 / 6 / 12-month plans
- Customer registration, login and session-based authentication
- Rental request with delivery date and address
- Customer rental history and support request form
- Admin dashboard: summary metrics, inventory updates, add/hide products, rental status management, support status management
- SQLite persistence and seeded sample products
- Basic validation and password hashing

## Requirements

- Node.js 20+ recommended
- npm

## Run locally

1. Extract the ZIP.
2. Open a terminal in the `rentease` project folder.
3. Install packages:

   ```bash
   npm install
   ```

4. (Recommended) Copy `.env.example` to `.env` and change the admin password and session secret. Environment variables are read by Node only if your hosting platform injects them; for local `.env` support install `dotenv` and add `require('dotenv').config()` at the very top of `src/server.js`, or set them in your terminal.
5. Start the app:

   ```bash
   npm start
   ```

6. Open http://localhost:3000

## Admin login

Default local demo credentials:

- Email: `admin@rentease.local`
- Password: `ChangeMe123!`

Change these before deployment. The admin account is created the first time the server starts, using `ADMIN_EMAIL` and `ADMIN_PASSWORD` if present.

## Main folders

- `public/index.html` — page structure
- `public/styles.css` — responsive visual styling
- `public/app.js` — browser interactions
- `src/server.js` — Express routes, validation, authentication, SQLite schema and seed data
- `data/rentease.db` — generated database file, created on first run

## API overview

- `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/me`
- `GET /api/products`, `GET /api/products/:id`
- `POST /api/rentals`, `GET /api/rentals`
- `POST /api/support`
- Admin: `GET /api/admin/summary`, `/api/admin/products`, `/api/admin/users`, `GET /api/support`, and PATCH/POST routes under `/api/admin/*`

## Important demo limitations

- Checkout submits a rental request only; no real payment gateway is connected.
- Delivery and pickup are represented by requested dates and admin-managed statuses; there is no logistics partner integration.
- Product images use external Unsplash URLs; replace them with licensed product images you control for a real deployment.
- The default Express in-memory session store is suitable only for local/demo use. Use a persistent session store and HTTPS in production.
- Add rate limiting, CSRF protection, production secret management, backups, privacy/terms pages and full security review before accepting real customer data.
