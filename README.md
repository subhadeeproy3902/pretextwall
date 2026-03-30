# PretextWall

**The Community Tweet Wall** — a curated, newspaper-style wall of tweets from the community.  
Live at **[pretextwall.netlify.app](https://pretextwall.netlify.app)**

![OG Preview](app/opengraph-image.tsx)
> The Open Graph preview image is auto-generated via Next.js App Router's built-in `opengraph-image.tsx` convention at [`app/opengraph-image.tsx`](app/opengraph-image.tsx). It renders server-side on the Edge and is served at `/opengraph-image` — no manual image file needed.

---

## Features

- **Newspaper-style masthead** — fluid typography using `@chenglou/pretext` for perfect single-line fill
- **Community tweet wall** — masonry grid of curated community tweets powered by `react-tweet`
- **Submit your tweet** — visitors can submit a tweet URL; it's committed directly to `lib/constants.ts` on the `master` branch via the GitHub Contents API
- **Rich tweet cards** — avatar, verified badge, media (photos + autoplay video), like/retweet/reply stats, visit link
- **Full SEO** — Open Graph tags, Twitter card, JSON-LD structured data, canonical URL, robots directives
- **Auto-generated OG image** — Next.js Edge runtime `opengraph-image.tsx` renders a branded 1200×630 preview

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Package manager | Bun |
| Tweet rendering | `react-tweet` |
| Typography | `@chenglou/pretext` |
| Styling | Tailwind CSS v4 + custom CSS variables |
| UI components | shadcn/ui |
| OG image | Next.js `ImageResponse` (Edge) |
| Deployment | Netlify |

---

## Project Structure

```
app/
  layout.tsx            ← root layout, metadata, JSON-LD
  page.tsx              ← main page (masthead + tweet wall + submit modal)
  opengraph-image.tsx   ← auto-generated OG / Twitter card image (Edge)
  globals.css           ← CSS variables, tw-* tweet card classes, masonry grid
  api/tweet/[id]/
    route.ts            ← proxy route for react-tweet data fetching
components/
  ui/tweet-card.tsx     ← MagicTweet, TweetCard, TweetSkeleton components
lib/
  constants.ts          ← COMMUNITY_TWEET_URLS array + GitHub config
  utils.ts              ← cn() helper
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- A GitHub Personal Access Token with **Contents: Read and Write** on this repo

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_GITHUB_TOKEN=your_pat_here
```

### Install & Run

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Adding Tweets

### Manually

Add a tweet URL to the `COMMUNITY_TWEET_URLS` array in [`lib/constants.ts`](lib/constants.ts) and push to `master`.

### Via the Site

1. Click **Submit a Tweet** on the site
2. Paste any `x.com/…/status/…` URL
3. Preview is shown before submitting
4. On submit, the URL is committed directly to `lib/constants.ts` on `master` via the GitHub Contents API

> The bot finds the insertion point using `// ← BOT_INJECT_ANCHOR (do not remove)` in `constants.ts`. **Do not delete that comment.**

---

## Open Graph Image

The OG / Twitter card preview image is generated dynamically by [`app/opengraph-image.tsx`](app/opengraph-image.tsx) using Next.js's built-in `ImageResponse` on the Edge runtime.

- **Route**: `GET /opengraph-image` (served automatically by Next.js)
- **Size**: 1200 × 630 px
- **Format**: PNG
- **Content**: Branded newspaper-style masthead with site name, tagline, and URL

No external image file is needed — edit `opengraph-image.tsx` to customise the design.

---

## SEO

- **Open Graph** + **Twitter Card** metadata in `app/layout.tsx`
- **JSON-LD** `WebSite` schema with `SearchAction`
- **Canonical URL**, `robots` directives, `metadataBase`
- **Auto OG image** via `app/opengraph-image.tsx` (Edge)

---

## Deployment

Deployed on **Netlify**. After pushing to `master`, Netlify automatically rebuilds.

To deploy yourself:

```bash
# Netlify CLI
netlify deploy --build --prod
```

Or connect the repo in the Netlify dashboard — set `NEXT_PUBLIC_GITHUB_TOKEN` in **Site settings → Environment variables**.

---

## License

MIT © [Subhadeep Roy](https://x.com/mvp_Subha)
