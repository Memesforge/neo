import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// small helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getOrigin() {
  const url = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "").trim();
  if (!url) return "http://localhost:3000";
  return url.startsWith("http") ? url.replace(/\/+$/, "") : `https://${url}`.replace(/\/+$/, "");
}

export async function POST(req) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    const version = process.env.REPLICATE_MODEL_VERSION;
    if (!token) return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
    if (!version) return NextResponse.json({ error: "Missing REPLICATE_MODEL_VERSION" }, { status: 500 });

    const { prompt } = await req.json().catch(() => ({}));
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // reference images (must exist in /public)
    const origin = getOrigin();
    const image_input = [
      `${origin}/neo1.png`,
      `${origin}/neo2.png`,
      `${origin}/neo3.png`,
      `${origin}/neo4.png`,
    ];

    // kick off prediction
    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version,
        input: {
          prompt,
          image_input,
          // optional tuning knobs:
          guidance_scale: 7,
          num_inference_steps: 24,
        },
      }),
    });

    if (!start.ok) {
      const text = await start.text();
      return NextResponse.json(
        { error: `Replicate start failed (${start.status}): ${text}` },
        { status: 502 }
      );
    }

    let prediction = await start.json();

    // poll until done (max ~90 seconds)
    const getUrl = prediction?.urls?.get;
    if (!getUrl) {
      return NextResponse.json({ error: "No polling URL from Replicate." }, { status: 502 });
    }

    let tries = 0;
    while (
      prediction?.status &&
      !["succeeded", "failed", "canceled"].includes(prediction.status) &&
      tries < 90
    ) {
      await sleep(1000);
      const res = await fetch(getUrl, {
        headers: { Authorization: `Token ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const t = await res.text();
        return NextResponse.json(
          { error: `Replicate poll failed (${res.status}): ${t}` },
          { status: 502 }
        );
      }
      prediction = await res.json();
      tries++;
    }

    if (prediction.status !== "succeeded") {
      return NextResponse.json(
        { error: `Generation ${prediction.status || "unknown"}`, prediction },
        { status: 502 }
      );
    }

    // Replicate outputs can be a string or an array of URLs
    const out = prediction.output;
    const imageUrl =
      (Array.isArray(out) && out.find((x) => typeof x === "string")) ||
      (typeof out === "string" ? out : null);

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL in final output.", prediction },
        { status: 502 }
      );
    }

    return NextResponse.json({ image: imageUrl, prediction }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 502 });
  }
}
