"use client";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault(); // <- stops page reload
    setErr("");
    setImg("");
    const p = prompt.trim();
    if (!p) return setErr("Type a prompt first.");
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // our API sends { error: "..." } on failures
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      // Support both possible API shapes
      // 1) { image: "https://..." }
      if (data?.image && typeof data.image === "string") {
        setImg(data.image);
      } else {
        // 2) Raw Replicate prediction: { output: [...] } or { urls: { get, cancel } }
        const out = data?.output;
        const url =
          (Array.isArray(out) && out.find(x => typeof x === "string")) ||
          (typeof out === "string" ? out : null);
        if (!url) throw new Error("No image URL returned.");
        setImg(url);
      }
    } catch (e) {
      setErr(e.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-4xl font-bold text-center">NEO Generator</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt here"
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-3 outline-none"
          />
          <button
            type="submit" // safe because we call e.preventDefault() above
            disabled={loading}
            className="w-full rounded-lg p-3 font-semibold
                       bg-gradient-to-r from-[#0d38fb] to-[#00e5ff] disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </form>

        {err && (
          <div className="text-red-400 bg-red-950/40 border border-red-700 rounded p-3">
            {err}
          </div>
        )}

        {img && (
          <div className="rounded-lg overflow-hidden border border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="result" className="w-full h-auto" />
          </div>
        )}
      </div>
    </main>
  );
}
