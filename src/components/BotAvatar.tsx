import type { BotPersona } from "../bots/personas";

/** A deterministic, generated avatar: a hue-tinted tile with the bot's glyph
 *  and an always-on "online" dot. No images, no network — just like the bots. */
export function BotAvatar({ persona, size = 42 }: { persona: BotPersona; size?: number }) {
  const { hue, glyph } = persona;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.48,
        background: `linear-gradient(140deg, hsl(${hue} 65% 24%), hsl(${(hue + 55) % 360} 60% 13%))`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 85% 62% / 0.45)`,
      }}
    >
      <span aria-hidden>{glyph}</span>
      <span
        aria-hidden
        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent"
      />
    </span>
  );
}
