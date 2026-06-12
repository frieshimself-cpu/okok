import { useEffect, useRef, useState } from "react";
import { FadeUp } from "./FadeUp";
import { MIcon } from "./MIcon";
import { useChain } from "../context/ChainContext";

interface Message {
  role: "assistant" | "user";
  text: string;
  seeded?: boolean;
}

const SEED_MESSAGES: Message[] = [
  {
    role: "assistant",
    seeded: true,
    text: "Welcome to the Verdant console — a full proof-of-work blockchain is running inside this page. I can mint wallets, sign transactions and mine blocks. What first?",
  },
  {
    role: "user",
    seeded: true,
    text: "Mine a block and show me the proof.",
  },
  {
    role: "assistant",
    seeded: true,
    text: "Every message you send below mines a real block: transactions signed with ECDSA, sealed with SHA-256 proof-of-work, the whole chain revalidated from genesis. Try it here — or scroll to the mining lab for the full explorer.",
  },
];

export function ChatPanel({ animateMessagesIn = false }: { animateMessagesIn?: boolean }) {
  const { booting, stats, handlePrompt } = useChain();
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = async () => {
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setPending(true);
    try {
      const reply = await handlePrompt(text);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `The chain rejected that: ${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 font-inter"
      style={{
        background: "rgba(8,8,10,0.6)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
          <MIcon name="terminal" size={14} className="text-white/80" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">Verdant console</span>
          <span className="text-[11px] text-white/40">Talk to the chain running on this page</span>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] tabular-nums text-white/40">
          <span
            className={`h-1.5 w-1.5 rounded-full ${booting ? "animate-pulse bg-white/30" : "bg-accent"}`}
          />
          {booting ? "booting" : `block #${stats?.height ?? 0}`}
        </span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 py-5 space-y-4">
        {messages.map((message, i) => {
          const row = (
            <div className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-white/15 text-white/90"
                    : "bg-white/5 text-white/70 border border-white/5"
                }`}
              >
                {message.text}
              </div>
            </div>
          );
          return animateMessagesIn ? (
            <FadeUp key={i} delay={message.seeded ? i * 0.12 : 0} y={16}>
              {row}
            </FadeUp>
          ) : (
            <div key={i}>{row}</div>
          );
        })}
        {pending && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm leading-relaxed text-white/50">
              mining<span className="animate-pulse">…</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/5">
        <div className="liquid-glass rounded-2xl flex items-end gap-2 p-2">
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Type anything to mine a block…"
            className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none max-h-32"
          />
          <button
            type="button"
            onClick={() => void send()}
            aria-label="Send"
            className={`bg-white text-black rounded-xl p-2 hover:bg-white/90 transition-colors ${pending ? "animate-pulse" : ""}`}
          >
            <MIcon name="arrow_upward" size={16} className="text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
