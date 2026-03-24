# 🏓 PadelTribe

A full-stack padel community platform. Create communities, manage players, organize tournaments in 8 formats, record scores live, and track rankings.

---

## ✨ Features

- **Admin registration** — sign up with email/password, create & manage your community
- **Player invite links** — generate shareable links; players register via phone OTP
- **8 Tournament formats**: Americano, Team Americano, Mexicano, Team Mexicano, Mix Americano, Mix Mexicano, King of the Court, Regular Sets
- **Live score recording** — enter scores directly on any device during matches
- **Automatic round generation** — correct pairings based on format rules & standings
- **Community rankings** — leaderboard updated automatically after each tournament

---

## 🚀 Setup (5 steps)

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Save your **Project URL** and **anon public key** (from Settings → API)

### 2. Set Up the Database

1. In Supabase, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/001_schema.sql`
3. Paste and **Run** — this creates all tables, policies, and triggers

### 3. Enable Phone Auth (for player OTP)

1. In Supabase → **Authentication → Providers → Phone**
2. Enable Phone provider
3. Set up a Twilio account (or use Supabase's built-in SMS for dev)

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 5. Install & Run

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deploy to Vercel (Free)

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## 📱 How It Works

### For Admins
1. Register at `/register` with email + password
2. Create a community (name, description, color)
3. Go to **Players** → generate invite links
4. Share links with your players
5. Create a tournament, choose format, set rules
6. Once enough players register, **Start Tournament**
7. Use **Score Entry** to record match results round by round
8. Click **Next Round** after all matches are done
9. **End Tournament** to finalize rankings

### For Players
1. Click the invite link shared by your admin
2. Enter your phone number → receive OTP → verify
3. Set your name (and gender for mixed formats)
4. You're in! Browse tournaments and register to play

---

## 🏆 Tournament Formats Explained

| Format | Partners | Scoring |
|--------|----------|---------|
| **Americano** | Rotate each round | Individual points |
| **Team Americano** | Fixed teams | Team points |
| **Mexicano** | Dynamic by ranking | Individual points |
| **Team Mexicano** | Fixed teams, ranked fixtures | Team points |
| **Mix Americano** | Men + Women rotate | Individual points |
| **Mix Mexicano** | Mixed dynamic pairs | Individual points |
| **King of the Court** | Winners stay, losers rotate | Court position |
| **Regular Sets** | Any pairing | Set wins |

---

## 🛠 Tech Stack

- **Frontend + API**: Next.js 14 (App Router)
- **Database + Auth**: Supabase (PostgreSQL + RLS)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel (recommended)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login & Register pages
│   ├── (dashboard)/         # Main app (protected)
│   │   ├── communities/     # Community management
│   │   │   └── [slug]/
│   │   │       ├── players/          # Members & invites
│   │   │       ├── tournaments/      # Tournament list & creation
│   │   │       │   └── [id]/
│   │   │       │       └── scoring/  # Live score entry
│   │   │       └── rankings/         # Leaderboard
│   │   └── profile/         # User profile
│   └── invite/[token]/      # Invite link handler
├── lib/
│   ├── supabase/            # Client & server Supabase setup
│   └── tournament/          # Round generation algorithms
└── types/                   # TypeScript types
```
