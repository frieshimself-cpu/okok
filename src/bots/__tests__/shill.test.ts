import { describe, expect, it } from "vitest";
import { makePost, seedFeed, TICKER } from "../shill";
import { PERSONAS } from "../personas";

const handles = new Set(PERSONAS.map((p) => p.handle));

describe("shill engine", () => {
  it("is deterministic for a fixed seed", () => {
    const a = makePost(42, { now: 1_000 });
    const b = makePost(42, { now: 1_000 });
    expect(a).toEqual(b);
  });

  it("always shills the ticker", () => {
    for (let seed = 0; seed < 500; seed++) {
      const post = makePost(seed, { now: 1_000 });
      expect(post.text).toContain(TICKER);
      expect(handles.has(post.persona.handle)).toBe(true);
    }
  });

  it("produces sane, non-negative engagement stats", () => {
    for (let seed = 0; seed < 200; seed++) {
      const { stats } = makePost(seed, { now: 1_000 });
      for (const v of [stats.replies, stats.reposts, stats.likes]) {
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("makes bots reply to other bots, never themselves", () => {
    let replies = 0;
    for (let seed = 0; seed < 600; seed++) {
      // Give every call a non-empty `recent` so replies are possible.
      const recent = seedFeed(4, seed + 9_000);
      const post = makePost(seed, { now: 2_000, recent });
      if (post.replyingTo) {
        replies++;
        expect(post.replyingTo.handle).not.toBe(post.persona.handle);
        expect(post.text).toContain(`@${post.replyingTo.handle}`);
      }
    }
    // With ~30% reply odds over 600 draws we expect plenty of threads.
    expect(replies).toBeGreaterThan(50);
  });

  it("seeds a feed in reverse-chronological order with unique ids", () => {
    const feed = seedFeed(12, 7, 1_000_000);
    expect(feed).toHaveLength(12);
    expect(new Set(feed.map((p) => p.id)).size).toBe(12);
    for (let i = 1; i < feed.length; i++) {
      expect(feed[i].createdAt).toBeLessThanOrEqual(feed[i - 1].createdAt);
    }
  });
});
