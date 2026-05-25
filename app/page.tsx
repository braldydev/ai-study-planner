"use client";

import { useState } from "react";

export default function Home() {
  const [subject, setSubject] = useState("");
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generatePlan() {
    if (cooldown) return;

    setCooldown(true);

    setTimeout(() => {
      setCooldown(false);
    }, 5000);

    setLoading(true);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        days,
        hours,
      }),
    });

    const data = await response.json();

    setPlan(data.plan);

    setLoading(false);
  }

  async function copyPlan() {
    await navigator.clipboard.writeText(plan);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-bold mb-8 text-center">
        AI Study Planner 📚
      </h1>

      <div className="w-full max-w-md flex flex-col gap-4">
        <input
          type="text"
          placeholder="Subject..."
          maxLength={50}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="p-4 rounded-2xl bg-white text-black text-lg"
        />

        <input
          type="number"
          placeholder="Days until exam..."
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="p-4 rounded-2xl bg-white text-black text-lg"
        />

        <input
          type="number"
          placeholder="Hours per day..."
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="p-4 rounded-2xl bg-white text-black text-lg"
        />

        <button
          onClick={generatePlan}
          disabled={
            loading ||
            cooldown ||
            !subject.trim() ||
            !days.trim() ||
            !hours.trim()
          }
          className="bg-white text-black px-8 py-3 rounded-2xl font-bold hover:scale-105 hover:bg-gray-300 transition shadow-xl disabled:opacity-50"
        >
          {loading
            ? "⏳ Generating..."
            : cooldown
            ? "Wait 5s..."
            : "Generate Study Plan"}
        </button>
      </div>

      {plan && (
        <div className="bg-zinc-900 p-6 rounded-2xl mt-8 max-w-3xl w-full shadow-2xl">
          <pre className="whitespace-pre-wrap text-lg font-semibold">
            {plan}
          </pre>

          <button
            onClick={copyPlan}
            className="mt-4 bg-white text-black px-4 py-2 rounded-xl font-bold hover:bg-gray-300 transition"
          >
            {copied ? "Copied! ✅" : "Copy Plan 📋"}
          </button>
        </div>
      )}
    </main>
  );
}