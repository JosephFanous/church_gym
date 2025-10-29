# Church Gym Rental Platform

A full-stack TypeScript application for managing gym rentals, built with:

- **Backend**: Express, SQLite (via `better-sqlite3`)
- **Frontend**: React + Vite + TypeScript
- **Payments**: Integration stubs for PayPal and Clover
- **Email**: Brevo transactional email API

## Project Structure

```
.
├── server/   # Express API
└── client/   # React single-page application
```

## Getting Started

### Requirements

- Node.js 22 LTS
- npm or pnpm
- (Optional) Brevo API key for transactional email
- (Optional) PayPal + Clover API credentials for live payments

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# update .env as needed
npm run dev
```

Key environment variables:

- `PORT` – API port (default `4000`)
- `DATABASE_PATH` – SQLite file (default `../data/church_gym.sqlite`)
- `ADMIN_API_KEY` – shared secret for admin routes
- `BREVO_*` – Brevo credentials for confirmation emails
- `BASE_RESERVATION_URL` – Base URL for deep-linking reservation confirmations

The API exposes:

- `GET /api/availability` – list of available 60-minute slots
- `POST /api/reservations` – create a reservation + initiate payment
- `GET /api/reservations/:id` – fetch reservation details
- `GET/PATCH/DELETE /api/admin/reservations` – admin management (requires header `x-admin-key`)

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api` to `localhost:4000`. Configure `VITE_API_BASE_URL` in `client/.env` when deploying.

## Payment Integrations

The code includes stubs for PayPal and Clover that log intent creation and return placeholder checkout URLs. Replace the stub implementations in:

- `server/src/services/payments/paypal.ts`
- `server/src/services/payments/clover.ts`

with live API calls when credentials are available.

## Email Notifications

`sendReservationConfirmation` posts to Brevo's SMTP API when `BREVO_API_KEY` and sender details are configured. Until then, the service logs a warning and skips email delivery.

## Admin Dashboard

Visit `/admin` in the SPA, enter the `ADMIN_API_KEY`, and manage bookings:

- View upcoming reservations with customer contact info
- Mark payments as captured
- Adjust start/end times
- Delete bookings

## Database

SQLite migrations run automatically on server startup and create tables for customers, reservations, and reservation audit history. Data is stored at the path specified by `DATABASE_PATH`.

## Deployment Notes

- Serve the built React app (`npm run build`) behind any static host.
- Expose the Express API (ensure HTTPS in production).
- Configure real payment webhooks to update reservation payment status.
- Lock down the admin key and rotate periodically.
