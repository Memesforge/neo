import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function getOrigin() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "").trim();
  if (!raw) return "http://localhost:3000";
  const u = raw.startsWith("http") ? raw : `https://${raw}`;
  return u.replace(/\/+$/, "");
}

export async function POST(req) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    const version = process.env.REPLICATE_MODEL_VERSION;

    if (!token) return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
    if (!version) return NextResponse.json({ error: "Missing REPLICATE_MODEL_VERSION" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const prompt = (body?.prompt || "").trim();
    if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

    const origin = getOrigin();
    const image_input = [
      `${origin}/neo1.png`,
      `${origin}/neo2.png`,
      `${origin}/neo3.png`,
      `${origin}/neo4.png`,
    ];

    // Kick off prediction
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
          guidance_scale: 7,
          num_inference_steps: 24,
        },
      }),
    });

    if (!start.ok) {
      const text = await start.text();
      return NextResponse.json({ error: `Replicate start failed (${start.status}): ${text}` }, { status: 502 });
    }

    let prediction = await start.json();

    // Poll until finished
    const pollUrl = prediction?.urls?.get;
    if (!pollUrl) {
      return NextResponse.json({ error: "No poll URL from Replicate", prediction }, { status: 502 });
    }

    let tries = 0;
    while (
      prediction?.status &&
      !["succeeded", "failed", "canceled"].includes(prediction.status) &&
      tries < 90
    ) {
      await wait(1000);
      const r = await fetch(pollUrl, {
        headers: { Authorization: `Token ${token}` },
        cache: "no-store",
      });
      if (!r.ok) {
        const txt = await r.text();
        return NextResponse.json({ error: `Replicate poll failed (${r.status}): ${txt}` }, { status: 502 });
      }
      prediction = await r.json();
      tries++;
    }

    if (prediction.status !== "succeeded") {
      return NextResponse.json({ error: `Generation ${prediction.status}`, prediction }, { status: 502 });
    }

    // Always return prediction for the UI to scan
    return NextResponse.json({ prediction }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 502 });
  }
}
