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
  "https://x.com/jaymehoffman/status/2038667078136115487",
  "https://x.com/Riyvir/status/2038093450139279426",
  "https://x.com/eduardo_sonnino/status/2038574988194902472",
  "https://x.com/solarise_webdev/status/2038330971397697895",
  // ← BOT_INJECT_ANCHOR (do not remove)
  "https://x.com/singular_prism/status/2038202011578155456",
];

// ── GitHub PR config ─────────────────────────────────────────────────────────
export const GH_OWNER = "subhadeeproy3902";
export const GH_REPO  = "pretextwall";
export const GH_FILE  = "lib/constants.ts";
export const GH_BASE  = "master";