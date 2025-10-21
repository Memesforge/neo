import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    const version = process.env.REPLICATE_MODEL_VERSION;
    if (!token) throw new Error("Missing REPLICATE_API_TOKEN");
    if (!version) throw new Error("Missing REPLICATE_MODEL_VERSION");

    const { prompt } = await req.json().catch(() => ({}));
    if (!prompt) throw new Error("Missing prompt");

    const origin = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL}`;
    const image_input = [`${origin}/neo1.png`, `${origin}/neo2.png`, `${origin}/neo3.png`, `${origin}/neo4.png`];

    // Quick sanity log
    console.log("ENV OK:", { origin, hasToken: !!token, hasVersion: !!version });

    const start = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ version, input: { prompt, image_input } }),
    });

    if (!start.ok) {
      const t = await start.text();
      throw new Error(`Replicate start failed: ${t}`);
    }

    const data = await start.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("API Error:", e);
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
