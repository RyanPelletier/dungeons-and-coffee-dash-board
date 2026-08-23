# Dungeons & Coffee

A campaign management site for tabletop D&D groups: a public campaign
dashboard, a digital character sheet per player, a DM dashboard for
leveling players, and a session-log blog with comments and art uploads.

The app is a fully static Next.js export (no server, no API routes) backed
directly by **Firebase** — Firestore for data, Firebase Auth for accounts,
and Firebase Storage for images. That combination is what lets it be hosted
for free on **GitHub Pages**: the static HTML/JS talks to Firebase straight
from the browser, and Firestore/Storage **security rules** (`firestore.rules`,
`storage.rules`) are the only access-control boundary, since there's no
backend to enforce anything server-side.

## Features

- **Campaign Dashboard** (`/`) — every character at a glance: name,
  race/class/bio, current HP, and gold (if the player has made it public).
  Public, no login required — updates live via Firestore listeners.
- **Player accounts** — register with an email/password and a first draft
  of their character (Firebase Auth).
- **Player Dashboard** (`/dashboard`) — a full character sheet players
  update themselves: HP, gold, ability scores, bio, gear.
- **Level-Up Checklist** — when the DM raises a player's level, their
  dashboard shows a step-by-step checklist that must be completed before
  the level-up is confirmed.
- **DM Dashboard** (`/dm`) — change player levels and assign the scribe.
- **Session Log** (`/sessions`) — a blog of session recaps. Only the scribe
  (or the DM) can write the main post; any signed-in player can comment.
  Both posts and comments support optional image uploads to Firebase
  Storage.

## One-time Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
3. **Build → Firestore Database** → create a database (any region; start in
   production mode — the rules in this repo replace the defaults).
4. **Build → Storage** → create a default bucket.
5. **Project settings → General → Your apps** → add a **Web app**, copy the
   `firebaseConfig` values into `.env` (see `.env.example`).
6. Deploy the security rules and log into the CLI once:
   ```bash
   npx firebase login
   npx firebase deploy --only firestore:rules,storage:rules --project <your-project-id>
   ```
7. Create the first DM account (see **Seeding data** below) — self-registration
   always creates a `PLAYER`, by design, so someone has to be promoted to DM
   out-of-band.

## Local development

Local dev runs against the **Firebase Local Emulator Suite** by default —
no real project needed to hack on the app.

```bash
npm install
cp .env.example .env
# in .env: set NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
#          (the other NEXT_PUBLIC_FIREBASE_* values can be any placeholder
#          strings when only talking to emulators)

npx firebase emulators:start   # terminal 1 — Auth :9099, Firestore :8080, Storage :9199, UI :4000
npm run seed                   # terminal 2 — seeds a DM + two sample players into the emulators
npm run dev                    # terminal 2 — http://localhost:3000
```

Seeded accounts:

| Role   | Email             | Password      | Notes            |
| ------ | ----------------- | ------------- | ---------------- |
| DM     | dm@table.game     | dungeonmaster |                   |
| Player | aria@table.game   | password123   | starts as scribe |
| Player | borin@table.game  | password123   |                   |

To seed a **real** project instead of the emulators: set
`GOOGLE_APPLICATION_CREDENTIALS` to a service account key JSON file and
`FIREBASE_PROJECT_ID` to your project id, then `npm run seed`.

## Deploying to GitHub Pages

1. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Add these repository secrets (**Settings → Secrets and variables →
   Actions**) from your Firebase web app config:
   `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`,
   `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`.
3. Push to `main`. `.github/workflows/deploy.yml` builds the static export
   (`NEXT_BASE_PATH` is set automatically to `/<repo-name>`) and publishes
   it to Pages.

To build the same way locally:

```bash
NEXT_BASE_PATH=/dungeons-and-coffee-dash-board npm run build   # outputs to ./out
```

## Tech notes / known tradeoffs

- **No backend at all** — every read and write goes straight from the
  browser to Firebase, authorized by `firestore.rules` / `storage.rules`.
  Read those files to see exactly what's enforced (only the DM can change
  `level`/`pendingLevelUp`, only the scribe/DM can create session posts,
  players can only edit their own character, etc.).
- **Gold visibility is a UI toggle, not a hard security boundary.**
  Firestore can't hide individual fields from a document read, so a
  player's "hide my gold" setting only hides it in the campaign dashboard
  UI — the field is still present in the document for anyone reading it
  directly. Fine for a private friend-group app; don't rely on it for
  anything more sensitive.
- **Session detail pages use a query param** (`/sessions/post?id=...`)
  instead of a dynamic route segment (`/sessions/[id]`), because a fully
  static export can't pre-render pages for IDs that don't exist yet at
  build time.
- Firebase's client config values (`NEXT_PUBLIC_FIREBASE_*`) are not
  secrets — they identify the project, not grant access — so it's normal
  for them to end up in the built JS bundle.
