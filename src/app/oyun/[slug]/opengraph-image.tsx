import { ImageResponse } from "next/og";
import { GAMES } from "@/data/games";
import { SITE_NAME } from "@/lib/site";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "PriceSpawn";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = GAMES.find((g) => g.slug === slug);
  const title = game?.title ?? SITE_NAME;
  const cover = game?.coverUrl;
  const meta = game ? `${game.genres.slice(0, 3).join(" · ")}  ·  ${game.score}/100` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#0a0b10",
          position: "relative",
        }}
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.55,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,11,16,0.2) 0%, rgba(10,11,16,0.95) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: 64,
          }}
        >
          <div style={{ display: "flex", fontSize: 28, color: "#8b8ba7", fontWeight: 600 }}>
            {SITE_NAME}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              color: "#ffffff",
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          {meta ? (
            <div style={{ display: "flex", fontSize: 30, color: "#c9c9e0" }}>{meta}</div>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}
