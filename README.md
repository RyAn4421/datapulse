# DataPulse

DataPulse is a Next.js SaaS dashboard for importing CSV, Excel, and JSON datasets, exploring rows, building charts, and generating quick analytics insights.

## Tech Stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS, Framer Motion, Lucide React |
| Data | MongoDB, Mongoose, SWR |
| Auth | NextAuth, Credentials, Google OAuth |
| Charts | Recharts |
| Import | PapaParse, XLSX |
| Notifications | Sonner |

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` with the variables below.
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Environment Variables

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string. |
| `NEXTAUTH_SECRET` | Secret used by NextAuth JWT sessions. |
| `NEXTAUTH_URL` | Local or deployed app URL, such as `http://localhost:3000`. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret. |

## MongoDB Atlas

Create an Atlas cluster, add a database user, allow your local IP address, and copy the connection string into `MONGODB_URI`. DataPulse creates users, datasets, rows, and insights collections as needed through Mongoose models.

## Folder Structure

| Path | Purpose |
| --- | --- |
| `app/(auth)` | Login and registration pages. |
| `app/(dashboard)` | Authenticated dashboard views. |
| `app/api` | Next.js API routes for auth, datasets, rows, and insights. |
| `components/charts` | Recharts cards and chart primitives. |
| `components/datasets` | Dataset list and upload controls. |
| `components/layout` | Providers, sidebar, topbar, mobile navigation. |
| `hooks` | SWR hooks for datasets, rows, and insights. |
| `lib` | MongoDB connection, models, utilities, and Zustand store. |
| `types` | Shared TypeScript interfaces. |

## Build

```bash
npm run build
```
