# SplitPesa — M-Pesa Bill Splitter & Group Payment Tracker

SplitPesa is a full-stack TypeScript web application (React 19 + Vite + Tailwind CSS + Express 5) that lets friends, housemates, and businesses split shared bills, send Safaricom M-Pesa payment prompts (`STK Push`), and track verified payment receipts in real time.

---

## Features

- **Multi-Page Website & Dashboard**: Includes Overview, How It Works, Pricing, Safety & Trust, Legal & Privacy Policies, Sign In / Registration, and a full Bill Splitting Dashboard.
- **Equal & Custom Bill Splits**: Split bills evenly to the exact shilling or assign custom meal/item amounts for 2 to 15 people.
- **Live & Demo M-Pesa Support**: Works out of the box in a safe Demo Mode for local testing, and switches automatically to live Safaricom M-Pesa phone prompts when Daraja credentials are provided in `.env`.
- **Zero-Setup Local Persistence + Auto MySQL Sync**: Works immediately after `git clone` using a local persistent store (`.data/splitpesa-store.json`), and automatically creates and syncs MySQL tables (`users`, `bills`, `contacts`) as soon as `DB_HOST` is configured.
- **Installable Mobile & Desktop App (PWA)**: Installable on Android, iPhone/iPad (Safari Add to Home Screen), and Desktop with offline view support.
- **Built-In Payment Safety**: Protects against accidental double charges, blocks duplicate phone numbers on the same bill, encrypts user passwords, and provides friendly error messages without exposing server internals.

---

## Quick Start (Clone & Run in 3 Steps)

### 1. Clone the repository and install dependencies

```bash
git clone https://github.com/Null-source404/mpesa_integrations.git
cd mpesa_integrations
npm install
```

### 2. Create your `.env` file (Optional for local testing)

```bash
cp .env.example .env
```

> **Note:** You do **not** need to configure MySQL or Safaricom Daraja keys just to run the app locally. If `.env` values are left blank, SplitPesa automatically uses its built-in local persistent store (`.data/splitpesa-store.json`) and Demo M-Pesa mode.

### 3. Start the application

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

- **Quick Demo Login**: Click **Sign In** → **Try Demo Account** (`amina@splitpesa.co.ke` / `SplitPesa2026!`) or create your own account.

---

## Connecting an External MySQL Database (Optional)

When you are ready to connect an external MySQL database (such as **Railway**, **Aiven**, **PlanetScale**, **Google Cloud SQL**, or local MySQL):

1. Open `.env` and fill in your database details:
   ```env
   DB_HOST=your-mysql-host.com
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=splitpesa
   DB_SSL=true
   ```
2. Restart the server (`npm run dev`). SplitPesa will **automatically create** the `users`, `bills`, and `contacts` tables (`CREATE TABLE IF NOT EXISTS`) on startup.

---

## Enabling Real M-Pesa PIN Prompts on Phones (Safaricom Daraja)

To send real M-Pesa STK Push prompts that ask users for their M-Pesa PIN on their phones:

1. Log in to the [Safaricom Daraja Developer Portal](https://developer.safaricom.co.ke/) and create an app with **Lipa Na M-Pesa Sandbox / Production** enabled.
2. Expose your local server to the internet during testing using **ngrok** (`ngrok http 3000`) or deploy the app to a public HTTPS URL so Safaricom can reach your `/api/callback` webhook.
3. Fill in your `.env` file:
   ```env
   DARAJA_ENV=sandbox
   DARAJA_CONSUMER_KEY=your_consumer_key
   DARAJA_CONSUMER_SECRET=your_consumer_secret
   DARAJA_SHORTCODE=174379
   DARAJA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
   DARAJA_CALLBACK_URL=https://your-domain-or-ngrok.app/api/callback
   ```
4. Restart the server (`npm run dev`).

---

## Available Scripts

- `npm run dev` — Starts the full-stack Express + Vite server on port `3000`
- `npm run build` — Builds the production frontend bundle into `dist/`
- `npm start` — Runs the production server (`NODE_ENV=production tsx server.ts`)
- `npm run lint` — Runs TypeScript type checking (`tsc --noEmit`)
