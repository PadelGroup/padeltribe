# CoPadel — Feature Backlog

## 🧪 In Testing
- Community logos (presets + upload)
- Community settings (color, description, location, social links)
- Multi-use invite links
- Public join page (`/join/[slug]`) with join requests
- Admin can promote players to co-admin
- Tournament venue (Google Maps link) + price per person
- Tournament date & time
- Padel level badges (D / D+ / C / C+ / B / B+ / A)

---

## 📬 Ready to activate (needs config)
- **Tournament email reminders**
  - Edge function deployed: `send-tournament-reminders`
  - Fires daily at 9AM UTC via pg_cron
  - Sends 24h-before reminder to all registered players
  - **To activate:** add `RESEND_API_KEY`, `APP_URL`, and `RESEND_FROM` as Supabase secrets
  - Needs a verified sending domain in Resend (set `RESEND_FROM` once domain is ready)

---

## 🗺️ City & Country Rankings
A global leaderboard aggregated across all communities in the same city/country.

**How it would work:**
- Each city/country has its own ranking table (separate from community rankings)
- Points earned in any community in that city count toward the city ranking
- Rankings are split by **player level** (e.g. top D players in Dubai, top B players in Barcelona) — so you compete against players at your own level, not everyone at once
- Players automatically appear in the city ranking of every city where they've played
- Dashboard has a **city/country switcher** so you can browse rankings for other cities (useful if you travel or play in multiple places)
- Profile shows which cities a player is active in

**DB work needed:**
- `city_rankings` table (city, country, user_id, level, points, tournaments_played)
- Hook into existing `update_community_rankings` RPC to also update city totals when a tournament completes
- RLS policies for public read, system-only write

**UI work needed:**
- `/rankings` page with city/country/level filters
- City switcher in dashboard nav or profile settings
- Badge on profile showing top ranking positions

---

## 💡 Other Ideas (parking lot)
- Push notifications for tournament start / new round
- Player availability calendar (mark days you're free to play)
- Match history page per player
- Community news feed / announcements
- Waiting list for full tournaments
- WhatsApp/Telegram bot integration for score entry
