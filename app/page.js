"use client";
import { useState } from "react";

// Deep scan for an image URL anywhere in the JSON
function findImageUrlDeep(any) {
  const urls = [];
  const rx = /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i;
  const rxRep = /^https?:\/\/replicate\.delivery\/.+/i;

  const walk = (v) => {
    if (!v) return;
    if (typeof v === "string") {
      if (rx.test(v) || rxRep.test(v)) urls.push(v);
      return;
    }
    if (Array.isArray(v)) return v.forEach(walk);
    if (typeof v === "object") return Object.values(v).forEach(walk);
  };

  walk(any);
  return urls[0] || null;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState(null);

  async function handleGenerate() {
    setError("");
    setImg("");
    setDebug(null);
    const text = prompt.trim();
    if (!text) {
      setError("Type a prompt first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      // our API returns { prediction }
      const prediction = data?.prediction ?? data;
      const url =
        // sometimes models return array of strings
        (Array.isArray(prediction?.output) &&
          prediction.output.find((x) => typeof x === "string")) ||
        // sometimes a single string
        (typeof prediction?.output === "string" ? prediction.output : null) ||
        // last resort: deep search for any image-like URL
        findImageUrlDeep(prediction);

      if (!url) {
        setDebug(prediction);
        throw new Error("No image URL returned by model.");
      }
      setImg(url);
    } catch (err) {
      setError(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-4">
        <h1 className="text-4xl font-bold text-center">NEO Generator</h1>

        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your prompt here"
          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-3 outline-none"
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-lg p-3 font-semibold bg-[#0d38fb] disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate"}
        </button>

        {error && (
          <div className="text-red-400 bg-red-950/30 border border-red-700 rounded p-3">
            {error}
          </div>
        )}

        {img && (
          <img
            src={img}
            alt="result"
            className="w-full rounded-lg border border-zinc-800"
          />
        )}

        {debug && (
          <details className="bg-zinc-900/60 border border-zinc-800 rounded p-3">
            <summary className="cursor-pointer">Debug JSON</summary>
            <pre className="text-xs whitespace-pre-wrap break-all">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
