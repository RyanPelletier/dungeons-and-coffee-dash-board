# Dungeons & Coffee

A campaign management site for tabletop D&D groups: a public campaign
dashboard, a digital character sheet per player, a DM dashboard for
leveling players, and a session-log blog with comments and art uploads.

The app is a fully static Next.js export (no server, no API routes) backed
directly by **Firebase** — Firestore for data and Firebase Auth for
accounts. That's what lets it be hosted for free on **GitHub Pages**: the
static HTML/JS talks to Firebase straight from the browser, and Firestore
**security rules** (`firestore.rules`) are the only access-control
boundary, since there's no backend to enforce anything server-side.

There's no third-party storage service for images, on purpose: Firebase
Storage has required the paid Blaze plan just to provision a bucket since
late 2024 (even though usage within the free tier still costs $0), so
uploads are stored **inline as base64 on the Firestore document itself** —
Firestore's free Spark plan needs no card on file at all. See
`src/components/ImageUploader.tsx` and the tradeoffs this forces, below.

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
  Both posts and comments support optional image uploads (resized and
  stored inline — see tradeoffs below).

## One-time setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
3. **Build → Firestore Database** → create a database (any region; start in
   production mode — the rules in this repo replace the defaults). Stay on
   the free **Spark** plan — no card needed.
4. **Project settings → General → Your apps** → add a **Web app**, copy the
   `firebaseConfig` values into `.env` (see `.env.example`).
5. Deploy the security rules and log into the CLI once:
   ```bash
   npx firebase login
   npx firebase deploy --only firestore:rules --project <your-project-id>
   ```
6. Create the first DM account (see **Local development** below) —
   self-registration always creates a `PLAYER`, by design, so someone has to
   be promoted to DM out-of-band.

That's it — no other service to configure. Image uploads run entirely in
the browser (resize + compress + base64-encode), so there's nothing to set
up for them.

## Local development

Local dev runs against the **Firebase Local Emulator Suite** by default —
no real project needed to hack on the app.

```bash
npm install
cp .env.example .env
# in .env: set NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
#          (the other NEXT_PUBLIC_FIREBASE_* values can be any placeholder
#          strings when only talking to emulators)

npx firebase emulators:start   # terminal 1 — Auth :9099, Firestore :8080, UI :4000
npm run seed                   # terminal 2 — seeds a DM + two sample players into the emulators
npm run dev                    # terminal 2 — http://localhost:3000
```

Image uploads never leave the browser except to write to Firestore, so
they work fully offline against the emulators too — no extra setup needed.

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
   Actions**), from your Firebase web app config:
   `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`,
   `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`.
3. Push to `main`. `.github/workflows/deploy.yml` builds the static export
   (`NEXT_BASE_PATH` is set automatically to `/<repo-name>`) and publishes
   it to Pages.

To build the same way locally:

```bash
NEXT_BASE_PATH=/dungeons-and-coffee-dash-board npm run build   # outputs to ./out
```

## Tech notes / known tradeoffs

- **No backend at all** — every read and write goes straight from the
  browser to Firebase, authorized by `firestore.rules`. Read that file to
  see exactly what's enforced (only the DM can change
  `level`/`pendingLevelUp`, only the scribe/DM can create session posts,
  players can only edit their own character, etc.).
- **Images are base64 data URIs stored directly on the post/comment
  document** — no separate storage service at all. This works, but runs
  straight into Firestore's **1 MiB per-document hard limit**:
  - `ImageUploader.tsx` resizes every image to a ~1280px longest edge and
    re-encodes it as JPEG, iterating the quality down until it's under
    ~700KB; if it still doesn't fit, the upload is rejected with an error
    rather than silently failing.
  - Each post/comment has a combined image budget of ~900KB, enforced
    client-side — add enough photos and it'll tell you to remove one
    before you can add another.
  - Animated GIFs don't survive this pipeline (canvas re-encoding
    flattens them to one static frame), so GIF is intentionally excluded
    from the accepted file types.
  - Every page that lists posts or characters downloads the full image
    payload for everything on it (there's no CDN, no lazy loading, no
    browser-cacheable separate image URLs) — fine for a small private
    campaign, but this won't scale gracefully to a large, image-heavy
    campaign the way a real image host would.
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
