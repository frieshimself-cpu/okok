import { MIcon } from "../MIcon";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/5">
      <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-6 px-6 py-12 sm:flex-row">
        <div className="flex items-center gap-2 text-foreground">
          <MIcon name="eco" size={18} />
          <span className="font-semibold tracking-tight">Verdant</span>
          <span className="text-sm text-white/30">· a proof-of-work chain in your browser</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-landing-text-muted">
          <a
            className="transition-colors hover:text-foreground"
            href="https://github.com/frieshimself-cpu/okok"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <a
            className="transition-colors hover:text-foreground"
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
