import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export function GET() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", background: "#f6f7f9", color: "#15171a", padding: "70px", borderLeft: "24px solid #e52521" }}>
      <div style={{ display: "flex", color: "#e52521", fontSize: 26, fontWeight: 700, marginBottom: 30 }}>TRACKS · SHORTCUTS · STRATEGIES</div>
      <div style={{ display: "flex", fontSize: 82, fontWeight: 700 }}>Mario Kart World</div>
      <div style={{ display: "flex", fontSize: 66, fontWeight: 700 }}>Wiki</div>
      <div style={{ display: "flex", fontSize: 30, color: "#6b7078", marginTop: 32 }}>40 tracks. Step-by-step shortcut guides.</div>
      <div style={{ display: "flex", fontSize: 20, color: "#6b7078", marginTop: 40 }}>An unofficial community guide</div>
    </div>,
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
