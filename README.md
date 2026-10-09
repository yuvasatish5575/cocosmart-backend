# CocoSmart – Backend API

REST API for **CocoSmart**, a full-stack e-commerce platform for coconut-based products.
Handles authentication, catalogue, cart, wishlist, addresses, checkout, orders and an admin console.

**Tech:** Node.js · Express 5 · TypeScript · MongoDB (Mongoose) · JWT · Zod · Vitest · Docker

Frontend: [cocosmart-frontend](https://github.com/yuvasatish5575/cocosmart-frontend)

---

## Features

- **Authentication**
  - Register, login, logout with **JWT access tokens (15 min) + refresh tokens (30 days)**
  - Refresh tokens are stored **hashed** in the database so they can be revoked
  - Passwords hashed with **argon2id**
  - **Email verification** and **password reset** with one-time codes (OTP), sent via Resend
    (falls back to an Ethereal test inbox in local development)
  - Role-based access: customer and admin
- **Catalogue:** products, categories, search, filters and pagination, product image uploads (Multer)
- **Cart, wishlist and saved addresses** per user
- **Checkout as a single MongoDB transaction:** prices, stock and totals are read fresh inside the
  transaction, so an order is never created with stale prices or out-of-stock items
- **Orders:** order history, order numbers, status updates by admin
- **Admin:** product and order management, dashboard data, activity log of admin actions
- **Security & reliability:** Helmet, CORS allow-list, rate limiting on auth routes,
  request validation with Zod, central error handler, compression, request logging (Morgan)
- **API docs:** Swagger UI at `/api/docs`
- **Tests:** Vitest + Supertest against an in-memory MongoDB replica set
  (auth, authorization, cart, orders, products, email verification)

## Architecture

```
routes  →  controllers  →  services  →  repositories  →  Mongoose models
              (HTTP)      (business logic)  (DB access)
```

- `routes/` – endpoints, validation and auth middleware
- `controllers/` – read the request, call a service, send the response
- `services/` – business rules (checkout, auth, cart …)
- `repositories/` – all database queries in one place
- `middleware/` – auth, validation, rate limiting, uploads, error handling

## API overview

| Base path | Purpose |
|-----------|---------|
| `/api/auth` | register, login, refresh, logout, verify email, reset password |
| `/api/products`, `/api/categories` | catalogue |
| `/api/cart`, `/api/wishlist`, `/api/addresses` | customer data |
| `/api/orders` | checkout and order history |
| `/api/admin` | admin-only management |
| `/api/uploads` | product image uploads |

Full request/response details: **`/api/docs`** (Swagger).

## Run locally

```bash
npm install
cp .env.example .env        # fill in values
npm run db:local            # terminal 1: local MongoDB replica set (needed for transactions)
npm run db:seed             # sample data + admin user
npm run dev                 # terminal 2: API on http://localhost:4000
```

Other scripts: `npm test` (tests), `npm run build` / `npm start` (production), `npm run make-admin`.
A `Dockerfile` is included for containerised deployment.
