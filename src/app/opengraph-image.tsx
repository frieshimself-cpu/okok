import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "$PREDICTIONS — Claude-powered Polymarket alpha";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#060809",
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,255,157,0.18), transparent)",
          color: "#e7ece9",
          fontSize: 96,
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex" }}>
          <span style={{ color: "#00ff9d" }}>$</span>PREDICTIONS
        </div>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 400, color: "#8b979d", marginTop: 24 }}>
          Claude reads the markets. You take the trade.
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#00ff9d", marginTop: 40 }}>
          AI-ranked Polymarket edges · token on pump.fun · not financial advice
        </div>
      </div>
    ),
    size,
  );
}
