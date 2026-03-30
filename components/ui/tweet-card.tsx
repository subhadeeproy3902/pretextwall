import { enrichTweet, type EnrichedTweet, type TweetProps } from "react-tweet"
import { getTweet, type Tweet } from "react-tweet/api"
import { Suspense } from "react"
import { cn } from "@/lib/utils"

// ── Icons ──────────────────────────────────────────────────────────────────
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const HeartIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const RetweetIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.791-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.791 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.104-.896-2-2-2z" />
  </svg>
)

const ReplyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const LinkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const VerifiedIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Verified">
    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
  </svg>
)

// ── Helpers ────────────────────────────────────────────────────────────────
export const truncate = (str: string | null, length: number) => {
  if (!str || str.length <= length) return str
  return `${str.slice(0, length - 3)}...`
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  return String(n)
}

function fmtDate(raw: string): string {
  const d = new Date(raw)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// ── Skeleton ───────────────────────────────────────────────────────────────
export const TweetSkeleton = ({
  className,
  ...props
}: { className?: string; [key: string]: unknown }) => (
  <div className={cn("nwp-tweet-skeleton", className)} {...props}>
    <div className="nwp-sk-header">
      <div className="nwp-sk-avatar" />
      <div className="nwp-sk-names">
        <div className="nwp-sk-line nwp-sk-name" />
        <div className="nwp-sk-line nwp-sk-handle" />
      </div>
    </div>
    <div className="nwp-sk-line nwp-sk-body1" />
    <div className="nwp-sk-line nwp-sk-body2" />
    <div className="nwp-sk-line nwp-sk-body3" />
  </div>
)

// ── Not Found ──────────────────────────────────────────────────────────────
export const TweetNotFound = ({
  className,
  ...props
}: { className?: string; [key: string]: unknown }) => (
  <div className={cn("nwp-tweet-notfound", className)} {...props}>
    <span className="nwp-tweet-notfound-icon">✕</span>
    <p className="nwp-tweet-notfound-text">Tweet not found</p>
  </div>
)

// ── Card body ──────────────────────────────────────────────────────────────
function NewspaperTweetBody({ tweet }: { tweet: EnrichedTweet }) {
  return (
    <div className="nwp-tweet-body">
      {tweet.entities.map((entity, idx) => {
        switch (entity.type) {
          case "url":
          case "symbol":
          case "hashtag":
          case "mention":
            return (
              <a key={idx} href={entity.href} target="_blank" rel="noopener noreferrer" className="nwp-tweet-link">
                {entity.text}
              </a>
            )
          case "text":
            return (
              <span key={idx} className="nwp-tweet-text" dangerouslySetInnerHTML={{ __html: entity.text }} />
            )
          default:
            return null
        }
      })}
    </div>
  )
}

// ── Media ──────────────────────────────────────────────────────────────────
function NewspaperTweetMedia({ tweet }: { tweet: EnrichedTweet }) {
  if (!tweet.video && !tweet.photos) return null
  return (
    <div className="nwp-tweet-media">
      {tweet.video && (
        <video poster={tweet.video.poster} autoPlay loop muted playsInline className="nwp-tweet-video">
          <source src={tweet.video.variants[0].src} type="video/mp4" />
        </video>
      )}
      {tweet.photos && (
        <div className={cn("nwp-tweet-photos", tweet.photos.length > 1 && "nwp-tweet-photos-grid")}>
          {tweet.photos.map((photo) => (
            <img key={photo.url} src={photo.url} alt={tweet.text} className="nwp-tweet-photo" />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Full card ──────────────────────────────────────────────────────────────
export const MagicTweet = ({
  tweet,
  className,
  ...props
}: {
  tweet: Tweet
  className?: string
  [key: string]: unknown
}) => {
  const t = enrichTweet(tweet)

  return (
    <article className={cn("nwp-tweet-card", className)} {...props}>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="nwp-tweet-header">
        <a href={t.user.url} target="_blank" rel="noreferrer" className="nwp-tweet-avatar-link">
          <img
            src={t.user.profile_image_url_https}
            alt={t.user.screen_name}
            width={44}
            height={44}
            className="nwp-tweet-avatar"
          />
        </a>

        <div className="nwp-tweet-user">
          <a href={t.user.url} target="_blank" rel="noreferrer" className="nwp-tweet-name">
            {truncate(t.user.name, 22)}
            {(t.user.verified || t.user.is_blue_verified) && (
              <VerifiedIcon className="nwp-tweet-verified" />
            )}
          </a>
          <a href={t.user.url} target="_blank" rel="noreferrer" className="nwp-tweet-handle">
            @{truncate(t.user.screen_name, 18)}
          </a>
        </div>

        <a href={t.url} target="_blank" rel="noreferrer" className="nwp-tweet-xlink" aria-label="View on X">
          <XIcon className="nwp-tweet-xicon" />
        </a>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <NewspaperTweetBody tweet={t} />

      {/* ── Media ──────────────────────────────────────── */}
      <NewspaperTweetMedia tweet={t} />

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="nwp-tweet-footer">
        <div className="nwp-tweet-stats">
          <span className="nwp-stat">
            <ReplyIcon className="nwp-stat-icon" />
            <span className="nwp-stat-num">{fmtCount(t.reply_count ?? 0)}</span>
          </span>
          <span className="nwp-stat">
            <RetweetIcon className="nwp-stat-icon" />
            <span className="nwp-stat-num">{fmtCount(t.retweet_count ?? 0)}</span>
          </span>
          <span className="nwp-stat nwp-stat-heart">
            <HeartIcon className="nwp-stat-icon" />
            <span className="nwp-stat-num">{fmtCount(t.favorite_count ?? 0)}</span>
          </span>
        </div>

        <div className="nwp-tweet-meta">
          <span className="nwp-tweet-date">{fmtDate(t.created_at ?? "")}</span>
          <a href={t.url} target="_blank" rel="noreferrer" className="nwp-tweet-visit" aria-label="Open tweet">
            <LinkIcon className="nwp-visit-icon" />
            <span>View post</span>
          </a>
        </div>
      </div>

    </article>
  )
}

// ── Server-side card ───────────────────────────────────────────────────────
export const TweetCard = async ({
  id,
  components,
  fallback = <TweetSkeleton />,
  onError,
  ...props
}: TweetProps & { className?: string }) => {
  const tweet = id
    ? await getTweet(id).catch((err) => {
        if (onError) onError(err)
        else console.error(err)
      })
    : undefined

  if (!tweet) {
    const NotFound = components?.TweetNotFound ?? TweetNotFound
    return <NotFound {...props} />
  }

  return (
    <Suspense fallback={fallback}>
      <MagicTweet tweet={tweet} {...props} />
    </Suspense>
  )
}


interface TwitterIconProps {
  className?: string
  [key: string]: unknown
}
const Twitter = ({ className, ...props }: TwitterIconProps) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 24 24"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <g>
      <path fill="none" d="M0 0h24v24H0z"></path>
      <path d="M22.162 5.656a8.384 8.384 0 0 1-2.402.658A4.196 4.196 0 0 0 21.6 4c-.82.488-1.719.83-2.656 1.015a4.182 4.182 0 0 0-7.126 3.814 11.874 11.874 0 0 1-8.62-4.37 4.168 4.168 0 0 0-.566 2.103c0 1.45.738 2.731 1.86 3.481a4.168 4.168 0 0 1-1.894-.523v.052a4.185 4.185 0 0 0 3.355 4.101 4.21 4.21 0 0 1-1.89.072A4.185 4.185 0 0 0 7.97 16.65a8.394 8.394 0 0 1-6.191 1.732 11.83 11.83 0 0 0 6.41 1.88c7.693 0 11.9-6.373 11.9-11.9 0-.18-.005-.362-.013-.54a8.496 8.496 0 0 0 2.087-2.165z"></path>
    </g>
  </svg>
)

const Verified = ({ className, ...props }: TwitterIconProps) => (
  <svg
    aria-label="Verified Account"
    viewBox="0 0 24 24"
    className={className}
    {...props}
  >
    <g fill="currentColor">
      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
    </g>
  </svg>
)

export const truncate = (str: string | null, length: number) => {
  if (!str || str.length <= length) return str
  return `${str.slice(0, length - 3)}...`
}

const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("bg-primary/10 rounded-md", className)} {...props} />
  )
}

export const TweetSkeleton = ({
  className,
  ...props
}: {
  className?: string
  [key: string]: unknown
}) => (
  <div
    className={cn(
      "flex size-full max-h-max min-w-72 flex-col gap-2 rounded-xl border p-4",
      className
    )}
    {...props}
  >
    <div className="flex flex-row gap-2">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <Skeleton className="h-10 w-full" />
    </div>
    <Skeleton className="h-20 w-full" />
  </div>
)

export const TweetNotFound = ({
  className,
  ...props
}: {
  className?: string
  [key: string]: unknown
}) => (
  <div
    className={cn(
      "flex size-full flex-col items-center justify-center gap-2 rounded-lg border p-4",
      className
    )}
    {...props}
  >
    <h3>Tweet not found</h3>
  </div>
)

export const TweetHeader = ({ tweet }: { tweet: EnrichedTweet }) => (
  <div className="flex flex-row items-start justify-between tracking-normal">
    <div className="flex items-center space-x-3">
      <a
        href={tweet.user.url}
        target="_blank"
        rel="noreferrer"
        className="shrink-0"
      >
        <img
          title={`Profile picture of ${tweet.user.name}`}
          alt={tweet.user.screen_name}
          height={48}
          width={48}
          src={tweet.user.profile_image_url_https}
          className="border-border/50 overflow-hidden rounded-full border"
        />
      </a>
      <div className="flex flex-col gap-0.5">
        <a
          href={tweet.user.url}
          target="_blank"
          rel="noreferrer"
          className="text-foreground flex items-center font-medium whitespace-nowrap transition-opacity hover:opacity-80"
        >
          {truncate(tweet.user.name, 20)}
          {tweet.user.verified ||
            (tweet.user.is_blue_verified && (
              <Verified className="ml-1 inline size-4 text-blue-500" />
            ))}
        </a>
        <div className="flex items-center space-x-1">
          <a
            href={tweet.user.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            @{truncate(tweet.user.screen_name, 16)}
          </a>
        </div>
      </div>
    </div>
    <a href={tweet.url} target="_blank" rel="noreferrer">
      <span className="sr-only">Link to tweet</span>
      <Twitter className="text-muted-foreground hover:text-foreground size-5 items-start transition-all ease-in-out hover:scale-105" />
    </a>
  </div>
)

export const TweetBody = ({ tweet }: { tweet: EnrichedTweet }) => (
  <div className="text-[15px] leading-relaxed tracking-normal wrap-break-word">
    {tweet.entities.map((entity, idx) => {
      switch (entity.type) {
        case "url":
        case "symbol":
        case "hashtag":
        case "mention":
          return (
            <a
              key={idx}
              href={entity.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground text-[15px] font-normal transition-colors"
            >
              <span>{entity.text}</span>
            </a>
          )
        case "text":
          return (
            <span
              key={idx}
              className="text-foreground text-[15px] font-normal"
              dangerouslySetInnerHTML={{ __html: entity.text }}
            />
          )
        default:
          return null
      }
    })}
  </div>
)

export const TweetMedia = ({ tweet }: { tweet: EnrichedTweet }) => {
  if (!tweet.video && !tweet.photos) return null
  return (
    <div className="flex flex-1 items-center justify-center">
      {tweet.video && (
        <video
          poster={tweet.video.poster}
          autoPlay
          loop
          muted
          playsInline
          className="rounded-xl border shadow-sm"
        >
          <source src={tweet.video.variants[0].src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      {tweet.photos && (
        <div className="relative flex transform-gpu snap-x snap-mandatory gap-4 overflow-x-auto">
          <div className="shrink-0 snap-center sm:w-2" />
          {tweet.photos.map((photo) => (
            <img
              key={photo.url}
              src={photo.url}
              width={photo.width}
              height={photo.height}
              title={"Photo by " + tweet.user.name}
              alt={tweet.text}
              className="h-64 w-5/6 shrink-0 snap-center snap-always rounded-xl border object-cover shadow-sm"
            />
          ))}
          <div className="shrink-0 snap-center sm:w-2" />
        </div>
      )}
      {!tweet.video &&
        !tweet.photos &&
        // @ts-expect-error package doesn't have type definitions
        tweet?.card?.binding_values?.thumbnail_image_large?.image_value.url && (
          <img
            src={
              // @ts-expect-error package doesn't have type definitions
              tweet.card.binding_values.thumbnail_image_large.image_value.url
            }
            className="h-64 rounded-xl border object-cover shadow-sm"
            alt={tweet.text}
          />
        )}
    </div>
  )
}

export const MagicTweet = ({
  tweet,
  className,
  ...props
}: {
  tweet: Tweet
  className?: string
}) => {
  const enrichedTweet = enrichTweet(tweet)
  return (
    <div
      className={cn(
        "relative flex h-fit w-full max-w-lg flex-col gap-4 overflow-hidden rounded-xl border p-5",
        className
      )}
      {...props}
    >
      <TweetHeader tweet={enrichedTweet} />
      <TweetBody tweet={enrichedTweet} />
      <TweetMedia tweet={enrichedTweet} />
    </div>
  )
}

/**
 * TweetCard (Server Side Only)
 */
export const TweetCard = async ({
  id,
  components,
  fallback = <TweetSkeleton />,
  onError,
  ...props
}: TweetProps & {
  className?: string
}) => {
  const tweet = id
    ? await getTweet(id).catch((err) => {
        if (onError) {
          onError(err)
        } else {
          console.error(err)
        }
      })
    : undefined

  if (!tweet) {
    const NotFound = components?.TweetNotFound ?? TweetNotFound
    return <NotFound {...props} />
  }

  return (
    <Suspense fallback={fallback}>
      <MagicTweet tweet={tweet} {...props} />
    </Suspense>
  )
}
