# המחלבה - פאב קהילתי

Full-stack web app for managing community pub events.

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Run in development (two terminals)
npm run dev:server   # starts Express on :3001
npm run dev:client   # starts Vite on :5173
```

## Admin

- URL: http://localhost:5173/admin/login
- Username: `admin`
- Password: `admin123`

## Customer

Customers scan a QR code pointing to `/event/:id`.
On first visit they register (name), which is remembered on their device.
They can then select products and quantities to log purchases.

## Tech Stack

- Backend: Node.js + Express + SQLite (better-sqlite3)
- Frontend: React 18 + Vite + React Router
- Auth: JWT (admin 7d, customer 30d)
- QR: `qrcode` package
- Excel export: `exceljs`
