# Joe Anderson Beat Store

Production beat store for browsing and purchasing instrumentals (MP3/WAV leases + exclusive rights). Includes an in-browser player, PayPal checkout, order persistence, and automated contract + delivery email. Successful purchase triggers an email with the contract
PDF attached and a presigned download URL valid for 24 hours.

Live site: https://jjaholics.xyz

## What the site does
- Lists beats from a Postgres database (title, artists, BPM, pricing)
- Streams MP3 previews with a persistent bottom player (play/pause, skip, seek slider, resume position per track)
- Lets a customer select a license type (MP3 lease / WAV lease / Exclusive)
- Creates and captures PayPal Orders (server-side)
- Persists completed orders to Postgres
- Generates a PDF contract (PDFKit) and emails it to the buyer
- Provides a time-limited, secure download link (S3 presigned URL; 24-hour TTL)

## Technical highlights
- Range-based audio streaming via a Next.js route (`206 Partial Content`) so the player can seek efficiently
- Presigned S3 URLs for secure access (no public bucket required)
- Reuses long-lived clients (S3 client + Postgres pool) across hot reloads in dev to avoid connection churn

## Tech stack
- Framework: Next.js (App Router) + React + TypeScript
- Styling: Tailwind CSS
- Payments: PayPal Orders API (server SDK) + PayPal JS buttons
- Storage: AWS S3 (presigned preview + downloads)
- Database: Postgres (via Supabase) using `pg`
- Email: Nodemailer (SMTP)
- PDF generation: PDFKit
- Hosted on Vercel

## Project structure
- `app/`
	- `beats/` – beats list + player UI
	- `beats/[id]/buy` – license selection + PayPal checkout
	- `api/payment` – creates PayPal orders
	- `api/payment/capture` – captures order, writes DB record, generates contract, emails receipt + download link
	- `api/beats/[s3_key]/stream` – range-based MP3 streaming endpoint
	- `api/beats/[s3_key]/preview` – short-lived presigned preview URL
- `lib/`
	- `db.ts` – Postgres queries for beats + orders
	- `s3.ts` – presigned URLs + ranged stream helpers
	- `paypal.ts` – PayPal client + access token helper
	- `contracts/` – contract text templates + PDF rendering
	- `email.ts` – SMTP mailer wrapper

## Running locally
1. Install deps: `pnpm install`
2. Add `.env` using the variables described in `.env.example`
3. Start dev server: `pnpm run dev`
4. Open http://localhost:3000
