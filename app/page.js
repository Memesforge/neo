"use client";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function generate(e) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setImage(null);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Generation failed");
      setImage(data.image);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4">
      <header className="text-center pt-10 pb-6">
        <h1 className="text-5xl font-extrabold tracking-tight">NEO</h1>
        <p className="text-[#a8a8a8] mt-2 text-lg">AI Crypto Image Generator</p>
      </header>

      <section className="w-full max-w-2xl bg-[#0b0b0b] border border-[#a8a8a8]/25 rounded-3xl shadow-2xl p-6">
        <form onSubmit={generate} className="flex flex-col gap-3">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt..."
            className="w-full p-4 rounded-xl bg-[#0f0f0f] text-white placeholder:text-[#a8a8a8] border border-[#0d38fb]/60 focus:outline-none focus:ring-2 focus:ring-[#0d38fb]"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-[#0d38fb] hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <img
            src="/neo4.png"
            alt="example"
            className="w-64 rounded-2xl border border-[#a8a8a8]/25 shadow"
          />
        </div>

        {err && <p className="text-red-400 mt-4 text-center">{err}</p>}
      </section>

      {image && (
        <section className="mt-10 mb-10 flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-3">Result</h2>
          <img
            src={image}
            alt="Generated"
            className="max-w-2xl w-full rounded-2xl shadow-2xl border border-[#a8a8a8]/30"
          />
        </section>
      )}

      <footer className="mt-auto py-8 text-[#a8a8a8] text-sm">
        Powered by{" "}
        <a href="https://hypertek.app/" className="text-[#0d38fb] underline">
          HyperTek
        </a>
      </footer>
    </main>
  );
}
