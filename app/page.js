"use client";
import { useState } from "react";

const BLUE = "#0d38fb";
const GREY = "#a8a8a8";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [img, setImg] = useState("/neo4.png");
  const [genImg, setGenImg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    const text = prompt.trim();
    if (!text) {
      setError("Type a prompt first.");
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
      if (typeof data?.image !== "string")
        throw new Error("No image content found in response");
      setGenImg(data.image);
    } catch (err) {
      setError(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-5xl font-extrabold tracking-tight" style={{ color: BLUE }}>
          NEO
        </h1>
        <p className="mt-2 text-base" style={{ color: GREY }}>
          AI Meme Generator
        </p>
      </div>

      {/* Card (medium-wide, centered) */}
      <div className="bg-[#0b0b0b] border border-zinc-800 rounded-2xl p-6 shadow-lg w-full max-w-[560px]">
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt here..."
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 focus:border-zinc-500 p-3 outline-none placeholder-zinc-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl p-3 font-semibold bg-[#0d38fb] text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Generating…" : "Generate Meme"}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-red-400 bg-red-950/30 border border-red-700 rounded-lg p-3 text-center">
            Generation failed: {error}
          </div>
        )}

        {/* Example image (always visible) */}
        <div className="mt-5 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt="example"
            className="w-64 h-64 rounded-xl border border-zinc-800 object-cover"
          />
        </div>
      </div>

      {/* Generated image below (same width as box, square shape) */}
      {genImg && (
        <div className="mt-8 w-full flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={genImg}
            alt="generated"
            className="rounded-2xl border border-zinc-700 object-cover shadow-lg"
            style={{
              width: "560px", // exact same width as card
              height: "560px", // square ratio
            }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-sm" style={{ color: GREY }}>
        Powered by{" "}
        <a
          href="https://hypertek.app/"
          target="_blank"
          rel="noreferrer"
          className="font-bold"
          style={{ color: BLUE, textDecoration: "none" }}
        >
          HyperTek
        </a>{" "}
        ⚡
      </div>
    </main>
  );
}
