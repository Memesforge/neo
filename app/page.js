"use client";
import { useState, useEffect } from "react";

/** brand colors */
const BLUE = "#0d38fb";       // vivid blue
const GREY = "#a8a8a8";       // grey

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [img, setImg] = useState("/neo4.png"); // example image shown on load
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // handle submit (supports Enter/Return)
  async function onSubmit(e) {
    e.preventDefault(); // stop page reload
    if (loading) return;
    const text = prompt.trim();
    if (!text) {
      setError("Type your prompt first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      // API returns { image: "https://..." }
      if (typeof data?.image === "string") {
        setImg(data.image);
      } else {
        throw new Error("No image URL returned.");
      }
    } catch (err) {
      setError(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1
            className="text-5xl font-extrabold tracking-tight"
            style={{ color: BLUE }}
          >
            NEO
          </h1>
          <p
            className="mt-2 text-base"
            style={{ color: GREY }}
          >
            AI Meme Generator
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0b0b0b] border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your prompt here"
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700 focus:border-zinc-500 p-3 outline-none placeholder-zinc-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl p-3 font-semibold transition
                         bg-gradient-to-r from-[#0d38fb] to-[#00e5ff]
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Generating…" : "Generate Meme"}
            </button>
          </form>

          {error && (
            <div className="mt-3 text-red-400 bg-red-950/30 border border-red-700 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Preview */}
          <div className="mt-5 overflow-hidden rounded-xl border border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="preview" className="w-full h-auto" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm" style={{ color: GREY }}>
          Powered by{" "}
          <a
            href="https://hypertek.app/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline"
          >
            HyperTek
          </a>{" "}
          ⚡
        </div>
      </div>
    </main>
  );
}
