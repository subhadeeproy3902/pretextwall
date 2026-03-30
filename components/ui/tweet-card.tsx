import { enrichTweet, type EnrichedTweet, type TweetProps } from "react-tweet"
import { getTweet, type Tweet } from "react-tweet/api"
import { Suspense } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

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

// ── Icons ──────────────────────────────────────────────────────────────────
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="tw-xicon" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const HeartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="tw-stat-icon" aria-hidden>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const RetweetIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="tw-stat-icon" aria-hidden>
    <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.791-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.791 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.104-.896-2-2-2z" />
  </svg>
)

const ReplyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="tw-stat-icon" aria-hidden>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const LinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="tw-link-icon" aria-hidden>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const VerifiedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="tw-verified" aria-label="Verified">
    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
  </svg>
)

// ── Skeleton ──────────────────────────────────────────────────────────────
export const TweetSkeleton = ({
  className,
  ...props
}: {
  className?: string
  [key: string]: unknown
}) => (
  <div className={cn("tw-card", className)} {...props}>
    <div className="tw-skeleton-header">
      <div className="tw-skeleton-avatar" />
      <div className="tw-skeleton-lines">
        <div className="tw-skeleton-line" style={{ width: "60%" }} />
        <div className="tw-skeleton-line" style={{ width: "40%" }} />
      </div>
    </div>
    <div className="tw-skeleton-line" style={{ width: "100%", height: "0.75rem" }} />
    <div className="tw-skeleton-line" style={{ width: "85%", height: "0.75rem" }} />
    <div className="tw-skeleton-line" style={{ width: "70%", height: "0.75rem" }} />
  </div>
)

// ── Not Found ─────────────────────────────────────────────────────────────
export const TweetNotFound = ({
  className,
  ...props
}: {
  className?: string
  [key: string]: unknown
}) => (
  <div className={cn("tw-card tw-not-found", className)} {...props}>
    <p>Tweet not found</p>
  </div>
)

// ── Header ────────────────────────────────────────────────────────────────
export const TweetHeader = ({ tweet }: { tweet: EnrichedTweet }) => (
  <div className="tw-header">
    <a href={tweet.user.url} target="_blank" rel="noreferrer" className="tw-avatar-link">
      <Image
        src={tweet.user.profile_image_url_https}
        alt={tweet.user.screen_name}
        width={44}
        height={44}
        className="tw-avatar"
      />
    </a>
    <div className="tw-user">
      <a href={tweet.user.url} target="_blank" rel="noreferrer" className="tw-name">
        {truncate(tweet.user.name, 22)}
        {(tweet.user.verified || tweet.user.is_blue_verified) && <VerifiedIcon />}
      </a>
      <a href={tweet.user.url} target="_blank" rel="noreferrer" className="tw-handle">
        @{truncate(tweet.user.screen_name, 18)}
      </a>
    </div>
    <a href={tweet.url} target="_blank" rel="noreferrer" className="tw-x-link" aria-label="View on X">
      <XIcon />
    </a>
  </div>
)

// ── Body ──────────────────────────────────────────────────────────────────
export const TweetBody = ({ tweet }: { tweet: EnrichedTweet }) => (
  <div className="tw-body">
    {tweet.entities.map((entity, idx) => {
      switch (entity.type) {
        case "url":
        case "symbol":
        case "hashtag":
        case "mention":
          return (
            <a key={idx} href={entity.href} target="_blank" rel="noopener noreferrer" className="tw-link">
              {entity.text}
            </a>
          )
        case "text":
          return (
            <span
              key={idx}
              dangerouslySetInnerHTML={{ __html: entity.text.replace(/\n/g, "<br />") }}
            />
          )
        default:
          return null
      }
    })}
  </div>
)

// ── Media ─────────────────────────────────────────────────────────────────
export const TweetMedia = ({ tweet }: { tweet: EnrichedTweet }) => {
  // @ts-expect-error package doesn't have type definitions
  const thumbUrl = tweet?.card?.binding_values?.thumbnail_image_large?.image_value?.url as string | undefined

  if (!tweet.video && !tweet.photos && !thumbUrl) return null

  return (
    <div className="tw-media">
      {tweet.video && (
        <video
          poster={tweet.video.poster}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="tw-video"
        >
          {tweet.video.variants
            .filter((v) => v.type === "video/mp4")
            .map((v) => (
              <source key={v.src} src={v.src} type="video/mp4" />
            ))}
          Your browser does not support the video tag.
        </video>
      )}
      {tweet.photos && (
        <div className={cn("tw-photos", tweet.photos.length > 1 && "tw-photos-grid")}>
          {tweet.photos.map((photo, i) => (
            <Image
              key={i}
              src={photo.url}
              width={photo.width}
              height={photo.height}
              alt={tweet.text}
              className="tw-photo"
            />
          ))}
        </div>
      )}
      {!tweet.video && !tweet.photos && thumbUrl && (
        <Image
          src={thumbUrl}
          width={600}
          height={300}
          alt={tweet.text}
          className="tw-photo"
        />
      )}
    </div>
  )
}

// ── Stats footer ──────────────────────────────────────────────────────────
export const TweetStats = ({ tweet }: { tweet: EnrichedTweet }) => {
  const t = tweet as EnrichedTweet & { reply_count?: number; retweet_count?: number }
  return (
    <div className="tw-footer">
      <div className="tw-stats">
        {t.reply_count != null && (
          <span className="tw-stat">
            <ReplyIcon />
            <span>{fmtCount(t.reply_count)}</span>
          </span>
        )}
        {t.retweet_count != null && (
          <span className="tw-stat">
            <RetweetIcon />
            <span>{fmtCount(t.retweet_count)}</span>
          </span>
        )}
        {t.favorite_count != null && (
          <span className="tw-stat tw-stat-heart">
            <HeartIcon />
            <span>{fmtCount(t.favorite_count)}</span>
          </span>
        )}
      </div>
      <a href={tweet.url} target="_blank" rel="noreferrer" className="tw-visit" aria-label="View post">
        <LinkIcon />
        <span>View post</span>
      </a>
    </div>
  )
}

// ── Full card ─────────────────────────────────────────────────────────────
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
    <div className={cn("tw-card", className)} {...props}>
      <TweetHeader tweet={enrichedTweet} />
      <TweetBody tweet={enrichedTweet} />
      <TweetMedia tweet={enrichedTweet} />
      <TweetStats tweet={enrichedTweet} />
    </div>
  )
}

// ── Server-side card ──────────────────────────────────────────────────────
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
