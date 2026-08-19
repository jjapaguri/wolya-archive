import { ImageResponse } from "next/og";

export const ogImageAlt = "WOLYA ARCHIVE";
export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

export function renderOgImage() {
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
          background: "#0d0b0a",
          color: "#f5f2ed",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 108,
            letterSpacing: 12,
            fontWeight: 600,
          }}
        >
          WOLYA
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 108,
            letterSpacing: 12,
            fontWeight: 300,
            color: "#703d1f",
            marginTop: -8,
          }}
        >
          ARCHIVE
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 6,
            marginTop: 40,
            textTransform: "uppercase",
            color: "#f5f2ed",
            opacity: 0.7,
          }}
        >
          Curated Vintage Select Shop
        </div>
      </div>
    ),
    { ...ogImageSize }
  );
}
