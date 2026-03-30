// ─────────────────────────────────────────────────────────────────────────────
// constants.ts  ·  PretextWall  ·  owned by @subhadeeproy3902 / @mvp_Subha
//
// HOW THIS FILE IS MANAGED:
//   When a visitor submits a tweet via the site, the client:
//   1. Reads this file via GitHub Contents API
//   2. Creates branch  add-tweet-<timestamp>
//   3. Injects the URL right after BOT_INJECT_ANCHOR below
//   4. Commits + opens a PR to main
//   Merge the PR → tweet goes live on the wall.
//
// ⚠️  Do NOT rename COMMUNITY_TWEET_URLS — the bot depends on the exact name.
// ⚠️  Do NOT remove the BOT_INJECT_ANCHOR comment — it is the insertion point.
// ─────────────────────────────────────────────────────────────────────────────

export const COMMUNITY_TWEET_URLS: readonly string[] = [
  "https://x.com/birdabo/status/2038219452337074677"
];

// ── GitHub PR config ─────────────────────────────────────────────────────────
export const GH_OWNER = "subhadeeproy3902";
export const GH_REPO  = "pretextwall";
export const GH_FILE  = "lib/constants.ts";
export const GH_BASE  = "main";