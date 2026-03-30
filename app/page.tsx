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
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.getBoundingClientRect().width - 48; // 24px padding each side
    if (width <= 0) return;

    let lo = 28, hi = 140, best = lo;
    while (lo <= hi) {
      const mid  = Math.floor((lo + hi) / 2);
      const font = `700 ${mid}px "Cinzel Decorative", serif`;
      const prep: PreparedText = prepare(text, font);
      const { lineCount } = layout(prep, width, mid * 1.1);
      if (lineCount <= 1) { best = mid; lo = mid + 1; }
      else                { hi  = mid - 1; }
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
      else            { lo = mid; }
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
  const [val,      setVal]      = useState(0);
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
  const [data,    setData]    = useState<Tweet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);

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
  const TOKEN  = process.env.NEXT_PUBLIC_GITHUB_TOKEN ?? "";
  const OWNER  = "subhadeeproy3902";
  const REPO   = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "pretextwall";
  const FILE   = "lib/constants.ts";
  const BASE   = "main";
  const ANCHOR = "// ← BOT_INJECT_ANCHOR (do not remove)";

  const h: HeadersInit = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  const fileRes  = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`, { headers: h });
  if (!fileRes.ok) throw new Error("Cannot read constants.ts");
  const fileData = await fileRes.json() as { content: string; sha: string };
  const current  = atob(fileData.content.replace(/\n/g, ""));
  if (!current.includes(ANCHOR)) throw new Error("BOT_INJECT_ANCHOR not found");

  const updated  = current.replace(ANCHOR, `${ANCHOR}\n  "${tweetUrl}",`);

  const refRes   = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/ref/heads/${BASE}`, { headers: h });
  if (!refRes.ok) throw new Error("Cannot get base ref");
  const baseSha  = (await refRes.json() as { object: { sha: string } }).object.sha;

  const branch   = `add-tweet-${Date.now()}`;
  const brRes    = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs`, {
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
  const [url,        setUrl]        = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState("");
  const inputRef                    = useRef<HTMLInputElement>(null);

  // Pretext Use 4: pre-measure button label width so it never reflows
  const [btnW, setBtnW] = useState(180);
  useEffect(() => {
    const label = submitting ? "Filing PR…" : "Submit to the Wall →";
    const seg   = prepareWithSegments(label, "600 13px 'Special Elite', monospace");
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
    try   { await onSubmit(url); setSubmitted(true); }
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
  const text  = chunk.repeat(5);
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
  const [modalOpen,    setModalOpen]    = useState(false);
  const [currentPage,  setCurrentPage]  = useState(1);
  const heroRef                         = useRef<HTMLDivElement>(null);
  const [heroW,    setHeroW]            = useState(0);
  const [pullW,    setPullW]            = useState(0);

  const totalPages  = Math.max(1, Math.ceil(SEED_IDS.length / PAGE_SIZE));
  const pagedIds    = SEED_IDS.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
      <style>{CSS}</style>

      <div className="page-bg">
        <div className="paper-wrap" ref={heroRef}>

          {/* ── Top Meta Strip ─────────────────────────────────────────── */}
          <div className="meta-strip">
            <span className="meta-item">Est. 2026</span>
            <span className="meta-item meta-center">Free · No Database · Pure GitHub</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// CSS — Vintage Newspaper × Beige Terracotta
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Special+Elite&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --paper:       #F4F1E8;
  --paper-dark:  #ECE7D8;
  --ink:         #1C1714;
  --ink-mid:     #4A3B2E;
  --ink-soft:    #8B7355;
  --terra:       #C4573C;
  --terra-bg:    #F2DDD7;
  --border:      #C8B89A;
  --border-dark: #1C1714;
  --shadow:      0 4px 32px rgba(28,23,20,.3);
  --shadow-lg:   0 12px 60px rgba(28,23,20,.4);
}

html{scroll-behavior:smooth}
body{background:var(--ink);font-family:'Old Standard TT',serif;-webkit-font-smoothing:antialiased;color:var(--ink)}

/* ── Paper wrap ─────────────────────────────────────────────────────────── */
.page-bg{
  min-height:100vh;
  background:var(--ink);
  background-image:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(200,184,154,.08) 40px);
}
.paper-wrap{
  max-width:100%; margin:0 auto;
  background:var(--paper);
  background-image:url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.045'/%3E%3C/svg%3E");
  box-shadow:var(--shadow-lg);
  position:relative;overflow:hidden;
}

/* ── Meta strip ─────────────────────────────────────────────────────────── */
.meta-strip{
  display:flex;justify-content:space-between;align-items:center;
  padding:.4rem 1.5rem;
  border-bottom:1px solid var(--border-dark);
  font-family:'Special Elite',monospace;font-size:.68rem;
  text-transform:uppercase;letter-spacing:.1em;color:var(--ink-mid);
}
.meta-center{text-align:center;flex:1}

/* ── Masthead ───────────────────────────────────────────────────────────── */
.masthead{
  padding:1.5rem 1.5rem .75rem;
  text-align:center;
  border-bottom:4px double var(--border-dark);
}
.masthead-title{
  font-family:'Cinzel Decorative',serif;
  font-weight:900;line-height:1;
  letter-spacing:-.02em;color:var(--ink);
  text-transform:uppercase;
  white-space:nowrap;
  overflow:visible;
  transition:opacity .35s ease;
  animation:fadeIn .6s ease both;
}
.masthead-sub{
  font-family:'Playfair Display',serif;
  font-size:clamp(.85rem,1.4vw,1.15rem);
  font-style:italic;color:var(--ink-mid);
  margin-top:.4rem;letter-spacing:.02em;
}
.masthead-rule-wrap{margin-top:.75rem}
.masthead-meta-bar{
  display:flex;justify-content:space-between;align-items:center;
  padding:.3rem 0;
  font-family:'Special Elite',monospace;font-size:.72rem;
  text-transform:uppercase;letter-spacing:.08em;color:var(--ink-mid);
}

/* Rules */
.rule-double{border-top:3px double var(--border-dark);margin:.3rem 0}
.rule-single{border-top:1px solid var(--border-dark);margin:.2rem 0}
.rule-thin  {border-top:1px solid var(--border);margin:.5rem 0 .6rem}

/* ── Ticker ─────────────────────────────────────────────────────────────── */
.ticker-rail{
  overflow:hidden;background:var(--ink);color:var(--paper);
  padding:.45rem 0;border-top:1px solid var(--border);
  border-bottom:1px solid var(--border);
}
.ticker-track{
  display:flex;width:max-content;
  animation:ticker 32s linear infinite;
  font-family:'Special Elite',monospace;font-size:.65rem;letter-spacing:.12em;
}
.ticker-track span{padding-right:2rem;white-space:nowrap}
@keyframes ticker{to{transform:translateX(-50%)}}

/* ── Main grid ──────────────────────────────────────────────────────────── */
.main-grid{
  display:grid;
  grid-template-columns:220px 1fr 240px;
  gap:0;
  padding:0;
}
@media(max-width:1024px){.main-grid{grid-template-columns:1fr}}

/* ── Sidebars ───────────────────────────────────────────────────────────── */
.sidebar-left,.sidebar-right{
  padding:1.25rem 1rem;
  display:flex;flex-direction:column;gap:1.25rem;
}
.sidebar-left{
  border-right:1px solid var(--border-dark);
  background:rgba(236,231,216,.4);
}
.sidebar-right{
  border-left:1px solid var(--border-dark);
  background:rgba(236,231,216,.4);
}
.sidebar-box{padding:.75rem;border:1px solid var(--border)}
.sidebar-box-counter{text-align:center}
.box-hed{
  font-family:'Cinzel Decorative',serif;font-size:.65rem;font-weight:700;
  text-transform:uppercase;letter-spacing:.12em;color:var(--ink);
  margin-bottom:.35rem;
}
.sidebar-body{
  font-size:.75rem;line-height:1.65;color:var(--ink-mid);
  text-align:justify;hyphens:auto;
}
.sidebar-body code{
  font-family:'DM Mono',monospace;font-size:.72em;
  background:var(--paper-dark);padding:.1em .3em;border-radius:3px;
}
.drop-cap{
  float:left;font-family:'Cinzel Decorative',serif;
  font-size:2.2rem;line-height:.8;margin-right:.1rem;margin-top:.05rem;
  color:var(--ink);
}
.sidebar-link{
  display:inline-block;margin-top:.5rem;
  font-family:'Special Elite',monospace;font-size:.68rem;
  color:var(--terra);text-decoration:none;letter-spacing:.04em;
}
.sidebar-link:hover{text-decoration:underline}
.api-snippet{
  font-family:'DM Mono',monospace;font-size:.65rem;line-height:1.7;
  color:var(--paper);background:var(--ink);
  padding:.7rem .8rem;border-radius:3px;white-space:pre;overflow-x:auto;
}
.counter-wrap{display:flex;align-items:baseline;justify-content:center;gap:.35rem;margin:.5rem 0}
.counter-num{
  font-family:'Cinzel Decorative',serif;font-size:3rem;font-weight:900;
  color:var(--terra);line-height:1;
}
.counter-label{font-family:'Special Elite',monospace;font-size:.8rem;color:var(--ink-mid)}
.counter-sub{font-size:.6rem;color:var(--ink-soft);font-style:italic;margin-top:.25rem}
.sidebar-ad{
  border-top:2px solid var(--border-dark);
  border-bottom:2px solid var(--border-dark);
  padding:.85rem .5rem;text-align:center;
}
.ad-tag{font-family:'Special Elite',monospace;font-size:.6rem;letter-spacing:.12em;color:var(--ink-soft);margin-bottom:.3rem}
.ad-hed{font-family:'Cinzel Decorative',serif;font-size:1rem;font-weight:700;margin-bottom:.2rem}
.ad-mono{font-family:'DM Mono',monospace;font-size:.75rem;color:var(--terra);margin-bottom:.3rem}
.ad-copy{font-size:.68rem;line-height:1.5;color:var(--ink-mid);margin-bottom:.3rem}
.ad-copy a{color:var(--terra);text-decoration:none}
.ad-copy a:hover{text-decoration:underline}
.ad-badge{
  display:inline-block;border:1px solid var(--border-dark);
  padding:.15rem .5rem;font-family:'Special Elite',monospace;
  font-size:.65rem;font-weight:700;
}
.meta-item-box{display:flex;gap:.4rem;margin-bottom:.6rem;align-items:flex-start}
.meta-num{font-family:'Cinzel Decorative',serif;font-size:.85rem;color:var(--terra);flex-shrink:0;line-height:1.4}
.meta-desc{font-size:.68rem;line-height:1.55;color:var(--ink-mid)}
.step-row{display:flex;gap:.5rem;align-items:flex-start;margin-bottom:.5rem}
.step-num{
  width:18px;height:18px;border-radius:50%;background:var(--ink);color:var(--paper);
  display:flex;align-items:center;justify-content:center;
  font-family:'Cinzel Decorative',serif;font-size:.55rem;font-weight:700;flex-shrink:0;
}
.step-text{font-size:.7rem;line-height:1.55;color:var(--ink-mid)}
.classified-ad{
  font-size:.68rem;line-height:1.5;color:var(--ink-mid);
  border-bottom:1px dashed var(--border);padding:.4rem 0;
}
.classified-ad:last-child{border-bottom:none}

/* ── Feature column ─────────────────────────────────────────────────────── */
.feature-col{
  padding:1.5rem 1.75rem;
  border-right:1px solid var(--border);
}
.feature-hed-wrap{margin-bottom:1.25rem}
.feature-hed{
  font-family:'Playfair Display',serif;
  font-size:clamp(1.8rem,3.5vw,3.2rem);
  font-weight:400;line-height:1.05;
  letter-spacing:-.025em;color:var(--ink);
  text-align:center;margin:.6rem 0;
}
.feature-hed-em{font-style:italic;color:var(--terra);text-transform:none}
.feature-deck{
  font-family:'Playfair Display',serif;font-style:italic;
  font-size:1.05rem;color:var(--ink-mid);text-align:center;line-height:1.6;
}

/* Ornamental divider */
.orn-divider{display:flex;align-items:center;gap:.75rem;margin:.75rem 0}
.orn-line{flex:1;border-top:1px solid var(--border-dark)}
.orn-label{
  font-family:'Special Elite',monospace;font-size:.6rem;
  letter-spacing:.18em;text-transform:uppercase;color:var(--ink-mid);
  white-space:nowrap;
}
.orn-fleur{color:var(--ink-mid);font-size:.9rem}

/* Pull quote */
.pull-wrap{text-align:center;margin:1rem auto}
.pull-quote{
  font-family:'Playfair Display',serif;font-style:italic;
  font-size:1.05rem;line-height:1.65;color:var(--ink-mid);
  border-left:3px solid var(--terra);padding:.5rem 1rem;
  text-align:left;
}
.pull-attr{
  font-family:'Special Elite',monospace;font-size:.68rem;
  color:var(--ink-soft);margin-top:.4rem;letter-spacing:.06em;
}

/* Article 2-col */
.article-columns{
  columns:2;gap:2rem;
  margin:1rem 0;
  text-align:justify;
  hyphens:auto;
}
.body-para{
  font-size:.82rem;line-height:1.75;color:var(--ink-mid);
  margin-bottom:.85rem;break-inside:avoid;
}

/* Byline */
.byline-strip{
  display:flex;align-items:center;gap:.5rem;
  font-family:'Special Elite',monospace;font-size:.65rem;
  color:var(--ink-soft);letter-spacing:.06em;
  padding:.4rem 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);
  margin:.75rem 0;flex-wrap:wrap;
}
.byline-strip a{color:var(--terra);text-decoration:none}
.byline-dot{color:var(--border)}

/* Tweet grid */
.tweet-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
  gap:1rem;margin:1rem 0;
}
.tweet-cell{
  display:flex;justify-content:center;
  animation:fadeUp .5s ease both;
}
/* react-tweet theming */
.tweet-cell [data-theme]{
  --tweet-bg:var(--paper-dark) !important;
  --tweet-border:var(--border) !important;
}

.wall-cta-wrap{text-align:center;padding:1rem 0}
.wall-cta-hed{
  font-family:'Playfair Display',serif;font-style:italic;
  font-size:1.3rem;color:var(--ink-mid);margin-bottom:.75rem;
}

/* Buttons */
.btn-ink{
  display:inline-flex;align-items:center;gap:.4rem;
  padding:.55rem 1.2rem;
  background:var(--ink);color:var(--paper);
  border:none;border-radius:0;
  font-family:'Special Elite',monospace;font-size:.78rem;
  letter-spacing:.06em;cursor:pointer;
  transition:background .15s,transform .1s;
}
.btn-ink:hover:not(:disabled){background:var(--terra);transform:translateY(-1px)}
.btn-ink:disabled{opacity:.5;cursor:not-allowed}
.btn-large{padding:.7rem 1.75rem;font-size:.85rem}
.btn-full{width:100%;justify-content:center;margin-top:.75rem}
.btn-ghost{
  display:inline-flex;align-items:center;
  padding:.55rem 1rem;
  background:transparent;color:var(--ink-mid);
  border:1px solid var(--border-dark);
  font-family:'Special Elite',monospace;font-size:.78rem;letter-spacing:.06em;cursor:pointer;
  transition:background .15s;
}
.btn-ghost:hover{background:var(--paper-dark)}

/* ── Footer ─────────────────────────────────────────────────────────────── */
.paper-footer{padding:.75rem 1.5rem 1.25rem}
.footer-inner{
  display:flex;justify-content:space-between;align-items:center;
  padding:.4rem 0;
  font-family:'Special Elite',monospace;font-size:.65rem;
  text-transform:uppercase;letter-spacing:.1em;color:var(--ink-soft);
}
.footer-center{font-family:'Playfair Display',serif;font-size:.85rem;font-style:italic;text-transform:none;letter-spacing:0;color:var(--ink-mid)}

/* ── Modal ───────────────────────────────────────────────────────────────── */
.modal-backdrop{
  position:fixed;inset:0;z-index:200;
  background:rgba(28,23,20,.72);
  backdrop-filter:blur(4px);
  display:flex;align-items:center;justify-content:center;
  padding:1rem;
  animation:backdropIn .18s ease;
}
@keyframes backdropIn{from{opacity:0}to{opacity:1}}
.modal-newspaper{
  background:var(--paper);
  background-image:url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.045'/%3E%3C/svg%3E");
  width:100%;max-width:70vw;max-height:90vh;overflow-y:auto;
  border:2px solid var(--border-dark);
  box-shadow:var(--shadow-lg);
  animation:panelIn .22s cubic-bezier(.34,1.4,.64,1) both;
}
@keyframes panelIn{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
.modal-header-strip{
  display:flex;align-items:center;justify-content:space-between;
  padding:.4rem 1rem;
  background:var(--ink);color:var(--paper);
  font-family:'Special Elite',monospace;font-size:.65rem;letter-spacing:.1em;
  text-transform:uppercase;
}
.modal-close-btn{
  background:transparent;border:none;color:var(--paper);
  font-size:1rem;cursor:pointer;line-height:1;padding:.1rem .3rem;
  transition:color .13s;
}
.modal-close-btn:hover{color:var(--terra-bg)}
.modal-body-grid{
  display:grid;grid-template-columns:2fr 3fr;gap:0;
}
@media(max-width:640px){.modal-body-grid{grid-template-columns:1fr}}
.modal-left-col{padding:1.25rem 1.25rem 1.25rem 1.5rem;border-right:1px solid var(--border)}
.modal-right-col{padding:1.25rem 1.5rem 1.25rem 1.25rem}
.modal-dateline{
  font-family:'Special Elite',monospace;font-size:.62rem;
  letter-spacing:.14em;color:var(--ink-soft);margin-bottom:.3rem;
}
.modal-hed{
  font-family:'Playfair Display',serif;font-weight:900;
  font-size:1.5rem;line-height:1.1;letter-spacing:-.02em;
  color:var(--ink);margin-bottom:.6rem;
}
.modal-deck{
  font-size:.78rem;line-height:1.65;color:var(--ink-mid);margin-bottom:1rem;
}
.modal-deck code{
  font-family:'DM Mono',monospace;font-size:.78em;
  background:var(--paper-dark);padding:.1em .3em;
}
.field-label{display:block;font-family:'Special Elite',monospace;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-mid);margin-bottom:.3rem}
.field-row{position:relative;margin-bottom:.45rem}
.field-icon{position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:var(--ink-soft);pointer-events:none;display:flex;align-items:center}
.field-input{
  width:100%;padding:.6rem .8rem .6rem 2.1rem;
  background:var(--paper-dark);border:1.5px solid var(--border-dark);
  font-family:'DM Mono',monospace;font-size:.78rem;color:var(--ink);outline:none;
  transition:border-color .13s,box-shadow .13s;
}
.field-input:focus{border-color:var(--terra);box-shadow:0 0 0 3px rgba(196,87,60,.15)}
.field-input::placeholder{color:var(--ink-soft);font-family:'Old Standard TT',serif}
.field-error{font-family:'Special Elite',monospace;font-size:.65rem;color:var(--terra);margin-bottom:.5rem}
.modal-actions{display:flex;gap:.5rem;justify-content:flex-end;margin-top:.85rem}
.modal-footnote{
  font-family:'Special Elite',monospace;font-size:.6rem;
  color:var(--ink-soft);margin-top:.75rem;line-height:1.6;
}
.modal-footnote a{color:var(--terra);text-decoration:none}
.preview-col-hed{
  font-family:'Special Elite',monospace;font-size:.6rem;
  letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:.3rem;
}
.preview-wrap{}
.preview-label{font-family:'Special Elite',monospace;font-size:.6rem;color:var(--ink-soft);letter-spacing:.08em;margin-bottom:.4rem}
.react-tweet-shell{border:1px solid var(--border);overflow:hidden;max-height:360px;overflow-y:auto;background:var(--paper-dark)}
.preview-invalid{
  padding:.6rem .75rem;background:#FEF2F2;border:1px solid rgba(196,87,60,.25);
  font-size:.75rem;color:#b91c1c;font-family:'Special Elite',monospace;
}
.preview-placeholder{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:2.5rem 1rem;
  border:1px dashed var(--border);color:var(--ink-soft);gap:.75rem;
}
.preview-ornament{font-size:1.5rem}
.preview-placeholder p{font-size:.72rem;line-height:1.6;font-family:'Old Standard TT',serif;font-style:italic}
.spin{
  width:12px;height:12px;border-radius:50%;
  border:2px solid rgba(244,241,232,.3);border-top-color:var(--paper);
  animation:spin .6s linear infinite;display:inline-block;flex-shrink:0;
}
@keyframes spin{to{transform:rotate(360deg)}}
.modal-success{
  display:flex;flex-direction:column;align-items:center;
  text-align:center;gap:1rem;padding:2.5rem 2rem;
}
.success-ornament{font-size:3rem;color:var(--terra);line-height:1}
.success-hed{font-family:'Cinzel Decorative',serif;font-size:1.5rem;font-weight:700}
.success-body{font-size:.8rem;line-height:1.65;color:var(--ink-mid);max-width:360px}
.success-body code{font-family:'DM Mono',monospace;font-size:.8em;background:var(--paper-dark);padding:.1em .35em}

/* ── MagicTweet newspaper skin ─────────────────────────────────────────── */
.magic-tweet-wrap{
  width:100%;
  background:var(--paper-dark);
  border:1px solid var(--border);
  border-radius:0;
  overflow:hidden;
}
.magic-tweet{
  background:var(--paper-dark) !important;
  border:none !important;
  border-radius:0 !important;
  color:var(--ink) !important;
  font-family:'Old Standard TT',serif !important;
  max-width:100% !important;
  width:100% !important;
}
/* header: name + handle */
.magic-tweet a{
  color:var(--ink) !important;
  text-decoration:none;
}
.magic-tweet a:hover{color:var(--terra) !important;}
/* tweet body text */
.magic-tweet [class*="text"]{
  font-family:'Old Standard TT',serif;
  color:var(--ink-mid) !important;
  font-size:.82rem !important;
}
/* muted / handle */
.magic-tweet [class*="muted"],[class*="foreground"]{
  color:var(--ink-soft) !important;
}
/* border inside card */
.magic-tweet [class*="border"]{
  border-color:var(--border) !important;
}
/* X icon in card */
.magic-tweet svg{color:var(--ink-soft) !important}
.magic-tweet svg:hover{color:var(--terra) !important}
/* skeleton */
.magic-tweet-skeleton{
  background:var(--paper-dark) !important;
  border:1px solid var(--border) !important;
  border-radius:0 !important;
  min-height:120px;
}
/* error */
.magic-tweet-error{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:100px;gap:.4rem;
}
.tweet-error-ornament{font-size:1.2rem;color:var(--ink-soft);opacity:.5}
.tweet-error-text{font-family:'Special Elite',monospace;font-size:.65rem;color:var(--ink-soft);letter-spacing:.08em}

/* ── Pagination ─────────────────────────────────────────────────────────── */
.pagination-wrap{margin:.75rem 0}
.pagination-bar{
  display:flex;align-items:center;justify-content:space-between;
  gap:.75rem;padding:.5rem 0;
}
.pag-btn{
  font-family:'Special Elite',monospace;font-size:.7rem;
  letter-spacing:.08em;padding:.4rem .75rem;
  white-space:nowrap;
}
.pag-pages{
  display:flex;flex-wrap:wrap;gap:.35rem;justify-content:center;
}
.pag-dot{
  min-width:28px;height:28px;
  background:transparent;border:1px solid var(--border);
  font-family:'Special Elite',monospace;font-size:.68rem;
  color:var(--ink-mid);cursor:pointer;
  display:inline-flex;align-items:center;justify-content:center;
  transition:background .13s,color .13s;
}
.pag-dot:hover{background:var(--paper-dark);color:var(--ink)}
.pag-dot-active{
  background:var(--ink) !important;color:var(--paper) !important;
  border-color:var(--ink) !important;
}

/* ── Animations ──────────────────────────────────────────────────────────── */
@keyframes fadeIn {from{opacity:0}to{opacity:1}}
@keyframes fadeUp {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

/* ── Responsive ──────────────────────────────────────────────────────────── */

/* Tablet ≤ 1024px: stack sidebars below, keep them visible */
@media(max-width:1024px){
  .main-grid{
    grid-template-columns:1fr;
    grid-template-rows:auto auto auto;
  }
  .sidebar-left{
    border-right:none;
    border-top:2px solid var(--border-dark);
    order:2;
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
    gap:1rem;
    padding:1rem 1rem;
    background:rgba(236,231,216,.4);
  }
  .sidebar-right{
    border-left:none;
    border-top:2px solid var(--border-dark);
    order:3;
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
    gap:1rem;
    padding:1rem 1rem;
    background:rgba(236,231,216,.4);
  }
  .feature-col{border:none;padding:1.25rem 1.25rem;order:1}
}

/* Small tablet / large mobile ≤ 768px */
@media(max-width:768px){
  .masthead{padding:1rem .75rem .5rem}
  .masthead-sub{font-size:.9rem}
  .masthead-meta-bar{font-size:.62rem;flex-wrap:wrap;gap:.25rem;justify-content:center}
  .meta-strip{padding:.3rem .75rem;font-size:.58rem;flex-wrap:wrap;gap:.2rem}
  .feature-hed{font-size:clamp(1.4rem,5vw,2.4rem)}
  .feature-deck{font-size:.9rem}
  .tweet-grid{grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
  .sidebar-left,.sidebar-right{
    grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
  }
}

/* Mobile ≤ 540px */
@media(max-width:540px){
  .masthead{padding:.75rem .5rem .5rem}
  .masthead-sub{font-size:.8rem}
  .meta-strip{font-size:.55rem;letter-spacing:.05em}
  .masthead-meta-bar{display:none}
  .rule-double,.rule-single{margin:.15rem 0}
  .article-columns{columns:1}
  .tweet-grid{grid-template-columns:1fr}
  .feature-col{padding:.75rem .75rem}
  .sidebar-left,.sidebar-right{
    grid-template-columns:1fr;
    padding:.75rem;
  }
  .modal-newspaper{height:90vh}
  .modal-body-grid{grid-template-columns:1fr}
  .modal-left-col{border-right:none;border-bottom:1px solid var(--border);padding:1rem}
  .modal-right-col{padding:1rem}
  .footer-inner{flex-direction:column;gap:.3rem;text-align:center}
  .footer-center{order:-1}
  .counter-num{font-size:2.2rem}
  .btn-large{padding:.6rem 1.25rem;font-size:.78rem}
  .wall-cta-hed{font-size:1rem}
}

/* Very small ≤ 380px */
@media(max-width:380px){
  .meta-strip{display:none}
  .feature-col{padding:.5rem}
  .ticker-track{animation-duration:18s}
}
`;