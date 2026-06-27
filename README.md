# ExTrack

ExTrack is a mobile-first expense tracking SPA with a smart CLI input that
parses expenses from a configurable template (e.g. "{amount} {title} {category}"),
allowing users to type "15000 nasi goreng makanan" and log it in one line.
Features dark mode, real-time charts, infinite-scroll history, and multi-format
export — all wrapped in a responsive layout with bottom nav on mobile and a
collapsed sidebar on desktop.

## Tech Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, React Query, Zustand, Recharts
- **Backend:** Express, PostgreSQL (Neon), JWT authentication, bcrypt
- **Deployment:** Vercel (serverless API + static frontend)

## Features

- **Smart CLI Input** — Type `5000 kopi minuman` and it's logged instantly
- **Quick Buttons** — One-tap expense logging from the dashboard
- **Dark Mode** — Persisted to localStorage, no flash on reload
- **Pie Chart** — Expense breakdown by category
- **Export** — Download as CSV, TXT, or XLSX
- **Filter & Sort** — By time, category, and sort direction
- **Infinite Scroll** — Paginated history with intersection observer
- **Mobile-First** — Bottom navigation on mobile, icon sidebar on desktop
