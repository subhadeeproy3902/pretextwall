/* eslint-disable react-hooks/set-state-in-effect */
"use client";

// ─── Dependencies ─────────────────────────────────────────────────────────────
// npm install @chenglou/pretext react-tweet
// ─────────────────────────────────────────────────────────────────────────────

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type RefObject,
} from "react";
import { MagicTweet, TweetSkeleton } from "../components/ui/tweet-card";
import type { Tweet } from "react-tweet/api";
import {
  prepare,
  layout,
  prepareWithSegments,
  walkLineRanges,
  type PreparedText,
} from "@chenglou/pretext";
import { COMMUNITY_TWEET_URLS } from "../lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => Promise<void>;
}

interface MeasuredMastheadProps {
  text: string;
  containerRef: RefObject<HTMLDivElement | null>;
}

interface PreviewProps {
  url: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractTweetId(url: string): string | null {
  const m = url.match(/\/status\/(\d+)/);
  return m ? m[1] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRETEXT USE 1 — MeasuredMasthead
// Binary-searches font-size via prepare() + layout() so the masthead title
// always fills its container in exactly 1 line — zero DOM reflow.
// ─────────────────────────────────────────────────────────────────────────────
function MeasuredMasthead({ text, containerRef }: MeasuredMastheadProps) {
  const [fontSize, setFontSize] = useState(80);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.getBoundingClientRect().width - 48; // 24px padding each side
    if (width <= 0) return;

    let lo = 28, hi = 140, best = lo;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const font = `700 ${mid}px "Cinzel Decorative", serif`;
      const prep: PreparedText = prepare(text, font);
      const { lineCount } = layout(prep, width, mid * 1.1);
      if (lineCount <= 1) { best = mid; lo = mid + 1; }
      else { hi = mid - 1; }
    }
    setFontSize(best);
    setReady(true);
  }, [text, containerRef]);

  return (
    <h1
      className="masthead-title"
      style={{ fontSize: `${fontSize}px`, opacity: ready ? 1 : 0 }}
    >
      {text}
    </h1>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRETEXT USE 2 — BalancedPull
// Uses prepareWithSegments + walkLineRanges to shrink-wrap a pull-quote to
// the tightest container width that still fits in ≤ 3 lines.
// ─────────────────────────────────────────────────────────────────────────────
function BalancedPull({ text, maxWidth }: { text: string; maxWidth: number }) {
  const [w, setW] = useState(maxWidth);

  useEffect(() => {
    if (maxWidth <= 0) return;
    const prepared = prepareWithSegments(text, "italic 400 18px 'Playfair Display', serif");
    let lo = maxWidth * 0.55, hi = maxWidth, best = maxWidth;
    while (hi - lo > 4) {
      const mid = (lo + hi) / 2;
      let count = 0;
      walkLineRanges(prepared, mid, () => { count++; });
      if (count <= 3) { best = mid; hi = mid; }
      else { lo = mid; }
    }
    setW(best);
  }, [text, maxWidth]);

  return (
    <blockquote className="pull-quote" style={{ maxWidth: `${w}px` }}>
      &quot;{text}&quot;
    </blockquote>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRETEXT USE 3 — MeasuredCounter
// Locks the counter element to the final measured width before animation starts,
// preventing layout shift as the number ticks up.
// ─────────────────────────────────────────────────────────────────────────────
function MeasuredCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  const [minWidth, setMinWidth] = useState(0);

  useEffect(() => {
    const seg = prepareWithSegments(String(target), "700 48px 'Cinzel Decorative', serif");
    let maxW = 0;
    walkLineRanges(seg, 400, (line) => { if (line.width > maxW) maxW = line.width; });
    setMinWidth(Math.ceil(maxW) + 8);
  }, [target]);

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const dur = 1400;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const t = setTimeout(() => { raf = requestAnimationFrame(tick); }, 600);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target]);

  return (
    <span className="counter-num" style={{ minWidth: `${minWidth}px`, display: "inline-block" }}>
      {val}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRETEXT USE 4 — ColumnBody
// Measures paragraph height at a given column width so the 2-column grid can
// be pre-balanced server-side-style without DOM reflow.
// ─────────────────────────────────────────────────────────────────────────────
function ColumnBody({ children }: { children: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    if (!ref.current || measured) return;
    const width = ref.current.getBoundingClientRect().width;
    if (width <= 0) return;
    const prep = prepare(children, "400 13px 'Old Standard TT', serif");
    const { lineCount } = layout(prep, width, 20);
    // lineCount is now available for virtualization / balanced column logic
    void lineCount;
    setMeasured(true);
  }, [children, measured]);

  return <p ref={ref} className="body-para">{children}</p>;
}

// ─── X Logo ───────────────────────────────────────────────────────────────────
function XLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ─── Client-side tweet fetcher ────────────────────────────────────────────────
function useTweetData(id: string | null) {
  const [data, setData] = useState<Tweet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) { setData(null); return; }
    setLoading(true); setError(false); setData(null);
    fetch(`/api/tweet/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [id]);

  return { data, loading, error };
}

// ─── Single wall tweet card ────────────────────────────────────────────────────
function WallTweetCard({ id, delay }: { id: string; delay: number }) {
  const { data, loading, error } = useTweetData(id);

  if (loading) return (
    <div className="tweet-cell" style={{ animationDelay: `${delay}ms` }}>
      <div className="magic-tweet-wrap">
        <TweetSkeleton className="magic-tweet-skeleton" />
      </div>
    </div>
  );
  if (error || !data) return (
    <div className="tweet-cell" style={{ animationDelay: `${delay}ms` }}>
      <div className="magic-tweet-wrap magic-tweet-error">
        <span className="tweet-error-ornament">✕</span>
        <p className="tweet-error-text">Tweet unavailable</p>
      </div>
    </div>
  );
  return (
    <div className="tweet-cell" style={{ animationDelay: `${delay}ms` }}>
      <div className="magic-tweet-wrap">
        <MagicTweet tweet={data} className="magic-tweet" />
      </div>
    </div>
  );
}

// ─── Tweet URL Preview ────────────────────────────────────────────────────────
function TweetPreview({ url }: PreviewProps) {
  const id = extractTweetId(url);
  const { data, loading, error } = useTweetData(id);

  if (!url) return null;
  if (!id) return (
    <div className="preview-invalid">✕ Not a valid X post URL — needs /status/&lt;id&gt;</div>
  );
  if (loading) return <div className="preview-wrap"><TweetSkeleton /></div>;
  if (error || !data) return (
    <div className="preview-invalid">Could not load tweet preview</div>
  );
  return (
    <div className="preview-wrap">
      <p className="preview-label">Live preview · real likes · retweets · avatar</p>
      <div className="react-tweet-shell">
        <MagicTweet tweet={data} className="magic-tweet" />
      </div>
    </div>
  );
}

// ─── GitHub PR Submit ─────────────────────────────────────────────────────────
async function submitViaGitHubPR(tweetUrl: string): Promise<void> {
  const TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN ?? "";
  const OWNER = "subhadeeproy3902";
  const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "pretextwall";
  const FILE = "lib/constants.ts";
  const BASE = "main";
  const ANCHOR = "// ← BOT_INJECT_ANCHOR (do not remove)";

  const h: HeadersInit = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  const fileRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`, { headers: h });
  if (!fileRes.ok) throw new Error("Cannot read constants.ts");
  const fileData = await fileRes.json() as { content: string; sha: string };
  const current = atob(fileData.content.replace(/\n/g, ""));
  if (!current.includes(ANCHOR)) throw new Error("BOT_INJECT_ANCHOR not found");

  const updated = current.replace(ANCHOR, `${ANCHOR}\n  "${tweetUrl}",`);

  const refRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/ref/heads/${BASE}`, { headers: h });
  if (!refRes.ok) throw new Error("Cannot get base ref");
  const baseSha = (await refRes.json() as { object: { sha: string } }).object.sha;

  const branch = `add-tweet-${Date.now()}`;
  const brRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs`, {
    method: "POST", headers: h,
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });
  if (!brRes.ok) throw new Error("Cannot create branch");

  const comRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`, {
    method: "PUT", headers: h,
    body: JSON.stringify({
      message: `feat: add community tweet\n\n${tweetUrl}`,
      content: btoa(unescape(encodeURIComponent(updated))),
      sha: fileData.sha, branch,
    }),
  });
  if (!comRes.ok) throw new Error("Cannot commit updated file");

  const prRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/pulls`, {
    method: "POST", headers: h,
    body: JSON.stringify({
      title: "feat: add community tweet to wall",
      head: branch, base: BASE,
      body: `## Community Tweet\n\n**URL:** ${tweetUrl}\n\nSubmitted via PretextWall · @mvp_Subha`,
    }),
  });
  if (!prRes.ok) throw new Error("Cannot open PR");
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────
function SubmitModal({ isOpen, onClose, onSubmit }: SubmitModalProps) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Pretext Use 4: pre-measure button label width so it never reflows
  const [btnW, setBtnW] = useState(180);
  useEffect(() => {
    const label = submitting ? "Filing PR…" : "Submit to the Wall →";
    const seg = prepareWithSegments(label, "600 13px 'Special Elite', monospace");
    let w = 0;
    walkLineRanges(seg, 500, (l) => { if (l.width > w) w = l.width; });
    setBtnW(Math.ceil(w) + 40);
  }, [submitting]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const valid = extractTweetId(url) !== null;

  const handleSubmit = useCallback(async () => {
    if (!valid) { setError("Paste a valid X post URL (x.com/…/status/…)"); return; }
    setError(""); setSubmitting(true);
    try { await onSubmit(url); setSubmitted(true); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Submission failed"); }
    finally { setSubmitting(false); }
  }, [url, valid, onSubmit]);

  const handleClose = () => { setUrl(""); setSubmitted(false); setError(""); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-newspaper" onClick={(e) => e.stopPropagation()}>

        {/* Masthead strip */}
        <div className="modal-header-strip">
          <span className="modal-vol">Vol. I  ·  Submit Edition</span>
          <span className="modal-date">PretextWall Dispatch</span>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {submitted ? (
          <div className="modal-success">
            <div className="success-ornament">❧</div>
            <h2 className="success-hed">Submitted!</h2>
            <p className="success-body">
              A Pull Request has been automatically filed against{" "}
              <code>constants.ts</code> on <strong>subhadeeproy3902/pretextwall</strong>.
              Once merged, your tweet joins the wall.
            </p>
            <button className="btn-ink" onClick={handleClose}>Return to the Wall</button>
          </div>
        ) : (
          <div className="modal-body-grid">
            <div className="modal-left-col">
              <p className="modal-dateline">— COMMUNITY SUBMISSION —</p>
              <h2 className="modal-hed">Submit an X Post to the Wall</h2>
              <div className="rule-double" />
              <p className="modal-deck">
                Paste the link to any X post. Our automated press will open a GitHub Pull
                Request against <code>constants.ts</code> — no database, no login, no fuss.
                The editor reviews and merges; your post goes live.
              </p>

              <label className="field-label">X / Twitter Post URL</label>
              <div className="field-row">
                <span className="field-icon"><XLogo size={14} /></span>
                <input
                  ref={inputRef}
                  type="url"
                  className="field-input"
                  placeholder="https://x.com/username/status/…"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  aria-label="X post URL"
                />
              </div>
              {error && <p className="field-error" role="alert">{error}</p>}

              <div className="modal-actions">
                <button className="btn-ghost" onClick={handleClose}>Cancel</button>
                <button
                  className="btn-ink"
                  style={{ minWidth: `${btnW}px` }}
                  onClick={handleSubmit}
                  disabled={submitting || !url}
                  aria-busy={submitting}
                >
                  {submitting
                    ? <><span className="spin" aria-hidden />Filing PR…</>
                    : "Submit to the Wall →"}
                </button>
              </div>

              <p className="modal-footnote">
                PRs are filed to <strong>subhadeeproy3902/pretextwall</strong> ·
                Built by <a href="https://x.com/mvp_Subha" target="_blank" rel="noopener noreferrer">@mvp_Subha</a>
              </p>
            </div>

            <div className="modal-right-col">
              <p className="preview-col-hed">LIVE PREVIEW</p>
              <div className="rule-thin" />
              <TweetPreview url={url} />
              {!url && (
                <div className="preview-placeholder">
                  <span className="preview-ornament">✦</span>
                  <p>Paste an X link to see a live preview with real likes &amp; retweets</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Marquee Ticker ───────────────────────────────────────────────────────────
function Ticker() {
  const chunk = "NO DOM REFLOW  ·  @chenglou/pretext  ·  SUB-MILLISECOND LAYOUTS  ·  FULL I18N  ·  PURE JS  ·  OPEN SOURCE  ·  ";
  const text = chunk.repeat(5);
  return (
    <div className="ticker-rail" aria-hidden>
      <div className="ticker-track"><span>{text}</span><span>{text}</span></div>
    </div>
  );
}

// ─── Ornamental Divider ───────────────────────────────────────────────────────
function OrnDivider({ label }: { label?: string }) {
  return (
    <div className="orn-divider">
      <span className="orn-line" />
      {label && <span className="orn-label">{label}</span>}
      {!label && <span className="orn-fleur">❦</span>}
      <span className="orn-line" />
    </div>
  );
}

// ─── Tweet IDs derived from lib/constants.ts ─────────────────────────────────
const SEED_IDS = COMMUNITY_TWEET_URLS
  .map(extractTweetId)
  .filter((id): id is string => id !== null);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 15;

export default function PretextWallPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroW, setHeroW] = useState(0);
  const [pullW, setPullW] = useState(0);

  const totalPages = Math.max(1, Math.ceil(SEED_IDS.length / PAGE_SIZE));
  const pagedIds = SEED_IDS.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(p, totalPages));
    setCurrentPage(clamped);
    document.querySelector('.feature-col')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setHeroW(w);
      setPullW(Math.min(w * 0.6, 560));
    });
    if (heroRef.current) obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, []);

  const handleSubmit = useCallback(async (url: string) => {
    await submitViaGitHubPR(url);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>

      <div className="page-bg">
        <div className="paper-wrap" ref={heroRef}>

          {/* ── Top Meta Strip ─────────────────────────────────────────── */}
          <div className="meta-strip">
            <span className="meta-item">Est. 2026</span>
            <span className="meta-item">Powered by @chenglou/pretext</span>
          </div>

          {/* ── Masthead ──────────────────────────────────────────────── */}
          <header className="masthead">
            {heroW > 0 && (
              <MeasuredMasthead
                text="PretextWall"
                containerRef={heroRef}
              />
            )}
            <p className="masthead-sub">Community Showcase of Projects Built with Pretext</p>

            <div className="masthead-rule-wrap">
              <div className="rule-double" />
              <div className="masthead-meta-bar">
                <span>Vol. I · No. 1</span>
                <span>{today}</span>
                <span>Late Edition</span>
              </div>
              <div className="rule-single" />
            </div>
          </header>

          {/* ── Ticker ────────────────────────────────────────────────── */}
          <Ticker />

          {/* ── Main Grid ─────────────────────────────────────────────── */}
          <main className="main-grid">

            {/* Left Sidebar */}
            <aside className="sidebar-left">
              {/* About Box */}
              <div className="sidebar-box">
                <h4 className="box-hed">What Is Pretext?</h4>
                <div className="rule-thin" />
                <p className="sidebar-body">
                  <span className="drop-cap">P</span>retext is a pure JavaScript
                  text measurement library by Cheng Lou. It side-steps DOM reflow
                  entirely — no <code>getBoundingClientRect</code>, no layout thrash.
                  Sub-millisecond. Full i18n. Open source.
                </p>
                <a href="https://github.com/chenglou/pretext" target="_blank" rel="noopener noreferrer" className="sidebar-link">
                  Read the Docs →
                </a>
              </div>

              {/* Pretext API Box */}
              <div className="sidebar-box">
                <h4 className="box-hed">The API</h4>
                <div className="rule-thin" />
                <pre className="api-snippet">{`import { prepare, layout }
  from '@chenglou/pretext'

const p = prepare(text, font)
const { height, lineCount }
  = layout(p, width, lineH)
// ↑ zero DOM reflow`}</pre>
              </div>

              {/* Counter */}
              <div className="sidebar-box sidebar-box-counter">
                <h4 className="box-hed">On the Wall</h4>
                <div className="rule-thin" />
                <div className="counter-wrap">
                  <MeasuredCounter target={SEED_IDS.length} />
                  <span className="counter-label">posts</span>
                </div>
                <p className="counter-sub">pre-measured by Pretext · no layout shift</p>
              </div>

              {/* Ad */}
              <div className="sidebar-ad">
                <p className="ad-tag">✦ Advertisement ✦</p>
                <h4 className="ad-hed">npm install</h4>
                <p className="ad-mono">@chenglou/pretext</p>
                <p className="ad-copy">The text library the web always needed. Free. Forever.</p>
                <span className="ad-badge">MIT</span>
              </div>
            </aside>

            {/* Centre Feature */}
            <section className="feature-col">

              {/* Feature Headline */}
              <div className="feature-hed-wrap">
                <OrnDivider label="FEATURE" />
                <h2 className="feature-hed">
                  Discover Beautiful Things
                  <em className="feature-hed-em"> Built with Pretext</em>
                </h2>
                <p className="feature-deck">
                  A community wall of projects powered by Cheng Lou&apos;s pure JS text
                  measurement library — no DOM reflow, full i18n, sub-millisecond.
                </p>
                <OrnDivider />
              </div>

              {/* Pull Quote — Pretext-balanced */}
              {pullW > 0 && (
                <div className="pull-wrap">
                  <BalancedPull
                    text="The library side-steps DOM reflow entirely — every layout call is pure arithmetic over cached segment widths."
                    maxWidth={pullW}
                  />
                  <p className="pull-attr">— Cheng Lou, @_chenglou</p>
                </div>
              )}

              {/* Article Body — 2 newspaper columns */}
              <div className="article-columns">
                <ColumnBody>
                  Industrial-age computing has reached a new peak. Pretext — the pure JavaScript text measurement library by Cheng Lou — has stormed the frontend world with a promise no library has kept before: measure text accurately, at sub-millisecond speed, without ever touching the DOM. No getBoundingClientRect. No offsetHeight. No layout reflow.
                </ColumnBody>
                <ColumnBody>
                  The library achieves this by running the browser&apos;s own font engine as ground truth via Canvas measureText, then performing pure arithmetic over cached segment widths. prepare() does the one-time analysis; layout() is the hot path thereafter — a mere 0.09ms for a 500-text batch. The community has taken notice.
                </ColumnBody>
                <ColumnBody>
                  &quot;It is a dawn of a new era,&quot; declared one contributor. From masonry grids to shrink-wrapped pull-quotes, from pre-measured buttons to jitter-free counters — Pretext unlocks layout primitives the web has been missing for decades. Proper virtualisation without guesstimates. Balanced text. Zero layout shift.
                </ColumnBody>
                <ColumnBody>
                  This very page uses Pretext in four distinct ways: the masthead font-size is binary-searched to fill the container in one line; the pull-quote is shrink-wrapped via walkLineRanges; the counter is pre-sized to the final digit count; and every submit button label is pre-measured so the UI never reflows mid-animation.
                </ColumnBody>
              </div>

              <div className="byline-strip">
                <span>By <a href="https://x.com/mvp_Subha" target="_blank" rel="noopener noreferrer">@mvp_Subha</a></span>
                <span className="byline-dot">·</span>
                <span>PretextWall Staff</span>
                <span className="byline-dot">·</span>
                <span>subhadeeproy3902/pretextwall</span>
              </div>

              <OrnDivider label="THE WALL" />

              {/* Tweet Grid */}
              <div className="tweet-grid">
                {pagedIds.map((id, i) => (
                  <WallTweetCard key={id} id={id} delay={i * 80} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-wrap">
                  <div className="rule-thin" />
                  <div className="pagination-bar">
                    <button
                      className="btn-ghost pag-btn"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >← Prev</button>

                    <div className="pag-pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          className={`pag-dot ${p === currentPage ? 'pag-dot-active' : ''}`}
                          onClick={() => goToPage(p)}
                          aria-label={`Page ${p}`}
                          aria-current={p === currentPage ? 'page' : undefined}
                        >{p}</button>
                      ))}
                    </div>

                    <button
                      className="btn-ghost pag-btn"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >Next →</button>
                  </div>
                  <div className="rule-thin" />
                </div>
              )}

              <OrnDivider />

              <div className="wall-cta-wrap">
                <p className="wall-cta-hed">
                  <em>Building something with Pretext?</em>
                </p>
                <button className="btn-ink btn-large" onClick={() => setModalOpen(true)}>
                  Submit to the Wall ↗
                </button>
              </div>
            </section>

            {/* Right Sidebar */}
            <aside className="sidebar-right">

              {/* Pretext Powers this Page */}
              <div className="sidebar-box">
                <h4 className="box-hed">Pretext Powers This Page</h4>
                <div className="rule-thin" />
                {[
                  ["①", "Masthead title font-size is binary-searched via prepare() + layout() — fits in 1 line, zero DOM reflow"],
                  ["②", "Pull-quote is shrink-wrapped with prepareWithSegments() + walkLineRanges()"],
                  ["③", "Counter pre-sizes to final digit width — no layout shift on tick"],
                  ["④", "Submit button label is pre-measured so it never reflows mid-animation"],
                ].map(([num, desc]) => (
                  <div key={num} className="meta-item-box">
                    <span className="meta-num">{num}</span>
                    <p className="meta-desc">{desc}</p>
                  </div>
                ))}
              </div>

              {/* How to Submit */}
              <div className="sidebar-box">
                <h4 className="box-hed">How to Submit</h4>
                <div className="rule-thin" />
                {[
                  "Paste your X post URL into the submission form",
                  "A GitHub PR is auto-filed to constants.ts",
                  "Editor @mvp_Subha reviews and merges",
                  "Your tweet joins the wall — no database needed",
                ].map((step, i) => (
                  <div key={i} className="step-row">
                    <span className="step-num">{i + 1}</span>
                    <p className="step-text">{step}</p>
                  </div>
                ))}
                <button className="btn-ink btn-full" onClick={() => setModalOpen(true)}>
                  Submit Now →
                </button>
              </div>

              {/* Classifieds */}
              <div className="sidebar-box">
                <h4 className="box-hed">Classifieds</h4>
                <div className="rule-thin" />
                {[
                  "WANTED: Demos using layoutNextLine() for flowing text around images. Contact @mvp_Subha.",
                  "FOR SALE: Old DOM reflow habits. Worn out. Good riddance.",
                  "LOST: My getBoundingClientRect calls. Found Pretext instead. Very happy.",
                ].map((ad, i) => (
                  <p key={i} className="classified-ad">{ad}</p>
                ))}
              </div>

              {/* Credits */}
              <div className="sidebar-ad">
                <p className="ad-tag">✦ Credits ✦</p>
                <p className="ad-copy" style={{ textAlign: "center" }}>
                  Library by{" "}
                  <a href="https://x.com/_chenglou" target="_blank" rel="noopener noreferrer">@_chenglou</a>
                </p>
                <p className="ad-copy" style={{ textAlign: "center" }}>
                  Wall by{" "}
                  <a href="https://x.com/mvp_Subha" target="_blank" rel="noopener noreferrer">@mvp_Subha</a>
                </p>
                <p className="ad-copy" style={{ textAlign: "center" }}>
                  <a href="https://github.com/subhadeeproy3902/pretextwall" target="_blank" rel="noopener noreferrer">
                    subhadeeproy3902/pretextwall ↗
                  </a>
                </p>
              </div>
            </aside>
          </main>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <footer className="paper-footer">
            <div className="rule-double" />
            <div className="footer-inner">
              <span className="footer-item">Printed with @chenglou/pretext</span>
              <span className="footer-center">
                <em>&quot;Measure First. Render Once.&quot;</em>
              </span>
              <span className="footer-item">Page {currentPage} of {totalPages}</span>
            </div>
          </footer>

        </div>
      </div>

      <SubmitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}