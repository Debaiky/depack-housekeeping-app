# Depack Housekeeping Evaluation App

A mobile-friendly web app for daily factory cleanliness audits. Staff log in with
their `@depack.co` email, rate ~19 areas (1–5) with optional photos, and results
are stored in Google Sheets / Google Drive. Daily, weekly, and monthly
satisfactory/unsatisfactory results are computed automatically.

## Scoring Matrix

Each area is rated 1–5, or **N/A** if it doesn't apply that day:

| Score | Meaning |
| --- | --- |
| 1 | Filthy / hazardous — immediate action required |
| 2 | Poor — significant cleaning needed |
| 3 | Acceptable — minimum standard |
| 4 | Good |
| 5 | Excellent / spotless |

Each Production Area sub-area also has a separate **Machine Cleanliness**
rating (1–5, shown as a sad-to-happy smiley with a red-to-green color scale,
or N/A) and an optional field for the **name of the person responsible** for
that machine.

**N/A handling**: any rating marked N/A is excluded from both the total and
the average for that day — it does not count against the score.

**Daily result**:
- `Total Score` = sum of all non-N/A ratings (area + machine ratings)
- `Average Score` = Total / (number of non-N/A ratings)
- **Unsatisfactory** if any single rating scores below 3, OR the average is below 3.5

**Weekly result**:
- Average of each day's average score
- **Unsatisfactory** if the weekly average is below 3.5, OR 2+ days that week were Unsatisfactory

**Monthly result**:
- Average of each day's average score in the month
- **Unsatisfactory** if the monthly average is below 3.5, OR 4+ days that month were Unsatisfactory

## Areas Evaluated

**Main Locations**: Warehouse, Office Building, Employee Changing Rooms, Cafeteria,
Sanitization Area, Back Area, Back Building.

**Production Area**: Breyer Extruder Area, RDK Area, RDM Area, Polytype Area,
Hybrid Area, Sleeving Area, Open Space, Stored Plastic Rolls, Crusher Area,
Quality Control Room, Compressors Area, Material Feeding Area.

## Setup

### 1. Google Cloud service account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/), create
   (or select) a project.
2. Enable the **Google Sheets API** and **Google Drive API**.
3. Create a Service Account (IAM & Admin → Service Accounts), then create a JSON
   key for it and download it.
4. From the JSON file, you'll need `client_email` and `private_key` for your
   `.env.local`.

### 2. Google Sheet

1. Create a new Google Sheet. Copy its ID from the URL:
   `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`
2. Create three tabs with these exact names and header rows:

   **Users** (row 1 headers): `email | passwordHash | name | createdAt`
   - Pre-populate one row per allowed employee, e.g. `john@depack.co | | John Doe | `
   - Leave `passwordHash` and `createdAt` blank — they're filled in on first login.

   **Evaluations** (row 1 headers):
   `date | timestamp | userEmail | areaId | areaLabel | rating | photoUrl | ratingType | responsiblePerson`
   - `rating` is `1`-`5` or `NA`
   - `ratingType` is `area` or `machine`
   - `responsiblePerson` is only set for `machine` rows

   **DailySummary** (row 1 headers):
   `date | totalScore | avgScore | status | submittedBy | ratedCount`

3. Share the spreadsheet with your service account's email address (the
   `client_email` from the JSON key) with **Editor** access.

### 3. Google Drive folder

1. Create a folder in Google Drive for evaluation photos.
2. Share it with the service account email (Editor access).
3. Copy the folder ID from its URL: `https://drive.google.com/drive/folders/<FOLDER_ID>`

### 4. Environment variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

For the Google credentials, the easiest and least error-prone option is to
base64-encode the entire downloaded JSON key file and put it in
`GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`:

```bash
base64 -i path/to/service-account-key.json | tr -d '\n'
```

Paste the output as the value of `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` (one long
line, no quotes needed). This avoids issues with pasting the multi-line
`private_key` directly into a `.env` file.

Generate a `JWT_SECRET` with:

```bash
openssl rand -base64 32
```

### 5. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first use, an employee
goes to **Set up your password**, enters their `@depack.co` email (which must
already exist as a row in the `Users` tab) and chooses a password.

### 6. Deploy

Deploy to [Vercel](https://vercel.com/new). Add all the environment variables
from `.env.local` to the Vercel project settings (Production + Preview).

> **Note:** Vercel's free tier limits request bodies to ~4.5MB. If users attach
> several full-resolution photos in one submission, the request may fail. Ask
> users to keep photos reasonably sized (most phone cameras allow choosing a
> smaller photo size, or the photo can be retaken at lower resolution).

## Logo

The header uses the Depack logo from `public/depack-logo.png`, rendered via
`app/components/Logo.tsx`.

## Project Structure

- `lib/areas.ts` — list of all evaluated areas
- `lib/scoring.ts` — daily/weekly/monthly scoring logic
- `lib/google.ts`, `lib/googleSheets.ts`, `lib/googleDrive.ts` — Google API helpers
- `lib/auth.ts` — session/auth helpers
- `app/login`, `app/set-password` — authentication pages
- `app/evaluate` — the daily evaluation form
- `app/history` — daily/weekly/monthly results
- `middleware.ts` — protects all routes except login/set-password
