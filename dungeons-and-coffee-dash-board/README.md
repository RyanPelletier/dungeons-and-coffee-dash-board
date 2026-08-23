# Dungeons & Coffee

A campaign management site for tabletop D&D groups. Built with Next.js (App
Router), Prisma + SQLite, NextAuth (credentials login), and Tailwind CSS —
everything runs locally with no external services required.

## Features

- **Campaign Dashboard** (`/`) — every active character at a glance: name,
  race/class/bio, current HP, and gold (if the player has made it public).
- **Player Accounts** — players register with an email/password and a first
  draft of their character.
- **Player Dashboard** (`/dashboard`) — a digital character sheet. Players
  update HP, gold, ability scores, bio, and gear themselves.
- **Level-Up Checklist** — when the DM bumps a player's level, their
  dashboard shows a step-by-step checklist (new HP, features, spells, ASI,
  etc.) that must be completed before the level-up is confirmed.
- **DM Dashboard** (`/dm`) — the DM changes player levels and assigns who is
  the party's scribe.
- **Session Log** (`/sessions`) — a blog of session recaps. Only the scribe
  (or the DM) can write the main post; any signed-in player can leave
  comments. Both posts and comments support optional image uploads for fan
  art or screenshots.

## Getting started

```bash
npm install
cp .env.example .env        # adjust NEXTAUTH_SECRET for real deployments
npm run db:push             # create the SQLite database from the schema
npm run db:seed             # seed a DM + two sample players
npm run dev                 # http://localhost:3000
```

Seeded accounts (from `npm run db:seed`):

| Role   | Email               | Password       | Notes             |
| ------ | ------------------- | -------------- | ----------------- |
| DM     | dm@table.game        | dungeonmaster  |                    |
| Player | aria@table.game      | password123    | starts as scribe  |
| Player | borin@table.game     | password123    |                    |

## Tech notes

- Data lives in `prisma/dev.db` (SQLite) — fine for a single table's
  campaign; swap the Prisma datasource for Postgres/MySQL if you need
  multi-instance hosting.
- Uploaded images are written to `public/uploads/` on the server's disk, so
  persistent storage is required if you deploy somewhere with an ephemeral
  filesystem.
- Auth uses NextAuth's Credentials provider with bcrypt-hashed passwords and
  JWT sessions — no external auth provider needed.
