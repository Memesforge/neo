"use client";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setError("");
    setImg("");
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      // try to find an image url in any known field
      const url =
        (Array.isArray(data.output) && data.output.find((x) => typeof x === "string")) ||
        (typeof data.image === "string" && data.image) ||
        null;

      if (!url) throw new Error("No image URL returned");
      setImg(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-4">
        <h1 className="text-4xl font-bold text-center">NEO TEST v1</h1>

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

        {error && <div className="text-red-400">{error}</div>}
        {img && <img src={img} alt="result" className="w-full rounded-lg border border-zinc-800" />}
      </div>
    </main>
  );
}
