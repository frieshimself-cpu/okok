import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Pause, Play, Repeat2, MessageCircle, Sparkles, Zap } from "lucide-react";
import { Section } from "./Section";
import { FadeUp } from "../FadeUp";
import { BotAvatar } from "../BotAvatar";
import { makePost, seedFeed, type ShillPost } from "../../bots/shill";

const MAX_POSTS = 9;
const STREAM_MS = 2_600;
const ENGAGE_MS = 1_500;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

function age(timestamp: number): string {
  const s = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

const fmt = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`);

/** Colorize $tickers, @handles and #hashtags inside a post body. */
const TOKEN = /(\$AttentionBot|\$ATB|@[A-Za-z0-9_]+|#[A-Za-z0-9_]+)/g;
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (part === "$ATB" || part === "$AttentionBot")
          return (
            <span key={i} className="font-semibold text-accent">
              {part}
            </span>
          );
        if (part.startsWith("@"))
          return (
            <span key={i} className="text-accent2">
              {part}
            </span>
          );
        if (part.startsWith("#"))
          return (
            <span key={i} className="text-accent/80">
              {part}
            </span>
          );
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function Stat({ icon, value }: { icon: ReactNode; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-white/40">
      {icon}
      <span className="tabular-nums">{fmt(value)}</span>
    </span>
  );
}

function PostCard({ post }: { post: ShillPost }) {
  const { persona, replyingTo, stats, hashtags, breaking } = post;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-3 rounded-2xl border px-4 py-3.5 ${
        breaking
          ? "border-accent/30 bg-accent/[0.06]"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <BotAvatar persona={persona} />
      <div className="min-w-0 flex-1 font-inter">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
          <span className="font-semibold text-foreground">{persona.name}</span>
          <span className="rounded bg-accent/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-widest text-accent">
            bot
          </span>
          <span className="font-mono text-xs text-white/40">@{persona.handle}</span>
          <span className="text-white/30">· {age(post.createdAt)}</span>
          {breaking && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
              <Zap size={11} /> live
            </span>
          )}
        </div>

        {replyingTo && (
          <p className="mt-0.5 text-xs text-white/40">
            replying to <span className="text-accent2">@{replyingTo.handle}</span>
          </p>
        )}

        <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/90">
          <Rich text={post.text} />
        </p>

        {hashtags.length > 0 && (
          <p className="mt-1.5 text-[13px] text-accent/75">{hashtags.join(" ")}</p>
        )}

        <div className="mt-2.5 flex items-center gap-5 text-xs">
          <Stat icon={<MessageCircle size={13} />} value={stats.replies} />
          <Stat icon={<Repeat2 size={14} />} value={stats.reposts} />
          <Stat icon={<Heart size={13} />} value={stats.likes} />
        </div>
      </div>
    </motion.li>
  );
}

export function Swarm() {
  const seedRef = useRef(Math.floor(Math.random() * 1_000_000));
  const nextSeed = () => seedRef.current++;

  const [posts, setPosts] = useState<ShillPost[]>(() =>
    seedFeed(MAX_POSTS, Math.floor(Math.random() * 50_000)),
  );
  const [paused, setPaused] = useState(prefersReducedMotion);
  const [online, setOnline] = useState(1240);

  // Re-render every few seconds so relative timestamps stay fresh.
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const t = setInterval(tick, 5_000);
    return () => clearInterval(t);
  }, []);

  const pushPost = useCallback(() => {
    setPosts((prev) => [makePost(nextSeed(), { recent: prev.slice(0, 5) }), ...prev].slice(0, MAX_POSTS));
  }, []);

  // Stream new shills while running.
  useEffect(() => {
    if (paused) return;
    const t = setInterval(pushPost, STREAM_MS);
    return () => clearInterval(t);
  }, [paused, pushPost]);

  // Let engagement counts tick up so the feed feels alive.
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setPosts((prev) =>
        prev.map((p) =>
          Math.random() < 0.5
            ? {
                ...p,
                stats: {
                  replies: p.stats.replies + (Math.random() < 0.3 ? 1 : 0),
                  reposts: p.stats.reposts + (Math.random() < 0.6 ? 1 : 0),
                  likes: p.stats.likes + Math.floor(Math.random() * 9),
                },
              }
            : p,
        ),
      );
    }, ENGAGE_MS);
    return () => clearInterval(t);
  }, [paused]);

  // Drift the "bots online" readout around a baseline.
  useEffect(() => {
    const t = setInterval(() => {
      setOnline((o) => Math.max(1180, o + Math.floor(Math.random() * 19) - 9));
    }, 3_200);
    return () => clearInterval(t);
  }, []);

  const postsPerMin = useMemo(() => Math.round(60_000 / STREAM_MS), []);

  return (
    <Section
      id="swarm"
      eyebrow="The Swarm"
      title="The bots are already shilling $ATB"
      intro="No one hired them. No one is posting these. A swarm of autonomous agents generates this feed live, in your browser — bots talking up the ticker, replying to each other, gaming their own ranking models. This is what marketing looks like when the audience is machines."
      className="py-24"
    >
      <FadeUp>
        <div className="liquid-glass overflow-hidden rounded-3xl">
          {/* Feed header */}
          <div className="machine-grid flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
              </span>
              <span className="font-mono text-sm font-medium tracking-wide text-foreground">
                live swarm
              </span>
              <span className="font-inter text-xs text-white/40">
                {online.toLocaleString()} bots online · ~{postsPerMin} shills/min
              </span>
            </div>
            <div className="flex items-center gap-2 font-inter">
              <button
                type="button"
                onClick={pushPost}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-accent-foreground transition-all hover:brightness-110"
              >
                <Sparkles size={13} /> Make a bot shill $ATB
              </button>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Resume the swarm" : "Pause the swarm"}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            </div>
          </div>

          {/* Feed */}
          <ul className="space-y-2.5 p-4 sm:p-5">
            <AnimatePresence initial={false}>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        <p className="mt-4 text-center font-inter text-xs leading-relaxed text-white/35">
          100% automated · 0 humans involved · every post above is generated on this page for
          illustration. Not financial advice — and definitely not advice from a human.
        </p>
      </FadeUp>
    </Section>
  );
}
