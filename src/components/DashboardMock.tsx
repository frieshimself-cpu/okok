import { ChatPanel } from "./ChatPanel";
import { LivePreviewHero } from "./LivePreviewHero";

/** Liquid-glass dashboard: live chain console on the left, site preview on the right. */
export function DashboardMock() {
  return (
    <div
      id="console"
      className="liquid-glass w-full max-w-[1100px] scroll-mt-24 sm:aspect-[16/10] lg:aspect-[16/9] rounded-2xl mx-auto overflow-hidden p-2 sm:p-3"
    >
      <div className="grid h-full grid-cols-1 sm:grid-cols-[minmax(220px,320px)_1fr] gap-2 sm:gap-3">
        {/* On phones the console stacks below the preview instead of vanishing. */}
        <div className="min-h-0 order-2 h-[380px] sm:order-none sm:h-auto">
          <ChatPanel animateMessagesIn />
        </div>
        <div className="min-h-0">
          <LivePreviewHero />
        </div>
      </div>
    </div>
  );
}
