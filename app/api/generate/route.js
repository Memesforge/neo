import { NextResponse } from "next/server";

const terminal = new Set(["succeeded", "failed", "canceled"]);

function siteOrigin() {
  const v = process.env.VERCEL_URL;
  if (!v) return "";
  return v.startsWith("http") ? v : `https://${v}`;
}

export async function POST(req) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    const version = process.env.REPLICATE_MODEL_VERSION;
    if (!token || !version)
      return NextResponse.json({ error: "Missing API credentials" }, { status: 500 });

    const { prompt } = await req.json().catch(() => ({}));
    if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

    const base = siteOrigin();
    const refs = [`${base}/neo1.png`, `${base}/neo2.png`, `${base}/neo3.png`, `${base}/neo4.png`];

    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        version,
        input: {
          prompt,
          image_input: refs,
          guidance_scale: 7,
          num_inference_steps: 20,
        },
      }),
    });

    const { id } = await start.json();
    let result;
    for (let i = 0; i < 45; i++) {
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { Authorization: `Token ${token}` },
      });
      const d = await poll.json();
      if (terminal.has(d.status)) {
        result = d;
        break;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }

    if (!result || result.status !== "succeeded")
      return NextResponse.json({ error: "Generation failed" }, { status: 502 });

    const url = result.output?.[0];
    return NextResponse.json({ image: url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
