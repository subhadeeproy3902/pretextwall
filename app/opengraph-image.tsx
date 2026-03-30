import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PretextWall — The Community Tweet Wall";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F0E8",
          fontFamily: "serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative border */}
        <div
          style={{
            position: "absolute",
            inset: 20,
            border: "3px double #2C2C2C",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: "1px solid #2C2C2C",
            display: "flex",
          }}
        />

        {/* masthead */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: "#1A1A1A",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: 16,
            textTransform: "uppercase",
          }}
        >
          PretextWall
        </div>

        {/* rule */}
        <div
          style={{
            width: 700,
            height: 3,
            background: "#1A1A1A",
            marginBottom: 24,
            display: "flex",
          }}
        />

        {/* tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#444",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          The Community Tweet Wall
        </div>

        {/* CTA */}
        <div
          style={{
            fontSize: 20,
            color: "#777",
            fontStyle: "italic",
            letterSpacing: "1px",
          }}
        >
          Discover · Share · Join the conversation
        </div>

        {/* bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            fontSize: 18,
            color: "#999",
            letterSpacing: "2px",
          }}
        >
          pretextwall.netlify.app
        </div>
      </div>
    ),
    { ...size }
  );
}
