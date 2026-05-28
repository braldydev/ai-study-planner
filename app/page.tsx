"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import jsPDF from "jspdf";

export default function Home() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("studyHistory");

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

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
        topic,
        level,
        days,
        hours,
      }),
    });

    const data = await response.json();

    setPlan(data.plan);

    setFlippedCards([]);

    const newHistory = [
      {
        subject,
        topic,
        level,
        plan: data.plan,
      },
      ...history,
    ];

    setHistory(newHistory);

    localStorage.setItem(
      "studyHistory",
      JSON.stringify(newHistory)
    );

    setLoading(false);
  }

  async function copyPlan() {
    await navigator.clipboard.writeText(plan);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  function toggleCard(index: number) {
    if (flippedCards.includes(index)) {
      setFlippedCards(
        flippedCards.filter((card) => card !== index)
      );
    } else {
      setFlippedCards([...flippedCards, index]);
    }
  }

  function loadHistory(savedPlan: string) {
    setPlan(savedPlan);
    setFlippedCards([]);
  }

  function clearHistory() {
    localStorage.removeItem("studyHistory");
    setHistory([]);
  }

  function downloadPDF() {
    const doc = new jsPDF();

    const pageHeight = doc.internal.pageSize.height;

    const margin = 15;

    const maxWidth = 180;

    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);

    doc.text("AI Study Plan", margin, y);

    y += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const cleanedPlan = plan
  .replace(/\\frac{([^}]*)}{([^}]*)}/g, "($1 / $2)")
  .replace(/\\left/g, "")
  .replace(/\\right/g, "")
  .replace(/\\cdot/g, "·")
  .replace(/\\times/g, "×")
  .replace(/[{}]/g, "")
  .replace(/\\/g, "")
  .replace(/\$/g, "");

const lines = doc.splitTextToSize(cleanedPlan, maxWidth);

    lines.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.text(line, margin, y);

      y += 7;
    });

    doc.save(`${subject}-${topic}-study-plan.pdf`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white flex flex-col items-center p-6">
      <h1 className="text-5xl font-bold mb-8 text-center mt-10">
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
          type="text"
          placeholder="Topic..."
          maxLength={100}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="p-4 rounded-2xl bg-white text-black text-lg"
        />

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="p-4 rounded-2xl bg-white text-black text-lg"
        >
          <option value="">Select study level...</option>
          <option value="Beginner">Beginner</option>
          <option value="Middle School">Middle School</option>
          <option value="High School">High School</option>
          <option value="College">College</option>
          <option value="University">University</option>
          <option value="Advanced">Advanced</option>
        </select>

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
            !topic.trim() ||
            !level.trim() ||
            !days.trim() ||
            !hours.trim()
          }
          className="bg-white text-black px-8 py-3 rounded-2xl font-bold hover:scale-105 hover:bg-gray-300 transition shadow-xl disabled:opacity-50 cursor-pointer"
        >
          {loading
            ? "⏳ Generating..."
            : cooldown
            ? "Wait 5s..."
            : "Generate Study Plan"}
        </button>
      </div>

      {history.length > 0 && (
        <div className="w-full max-w-3xl mt-10 bg-zinc-900 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">
              Study History 🕒
            </h2>

            <button
              onClick={clearHistory}
              className="bg-red-500 px-4 py-2 rounded-xl font-bold hover:bg-red-600 transition cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => loadHistory(item.plan)}
                className="bg-black border border-zinc-700 rounded-2xl p-4 text-left hover:scale-[1.01] transition cursor-pointer"
              >
                <p className="font-bold text-xl">
                  {item.subject}
                </p>

                <p className="text-zinc-400">
                  {item.topic}
                </p>

                <p className="text-zinc-500 text-sm">
                  {item.level}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {plan && (
        <div className="bg-zinc-900 p-6 rounded-2xl mt-10 max-w-3xl w-full shadow-2xl">
          <div className="prose prose-invert max-w-none">
            {plan.includes("FLASHCARDS") ? (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {plan
                    .split("FLASHCARDS")[0]
                    .replace(/\*\*/g, "")}
                </ReactMarkdown>

                <h2 className="text-3xl font-bold mt-8 mb-4">
                  FLASHCARDS 🧠
                </h2>

                <div className="flex flex-col gap-4">
                  {plan
                    .split("FLASHCARDS")[1]
                    ?.split("Q:")
                    .filter(
                      (card) =>
                        card.trim() !== "" &&
                        card.includes("A:")
                    )
                    .map((card, index) => {
                      const parts = card.split("A:");

                      const isFlipped =
                        flippedCards.includes(index);

                      return (
                        <div
                          key={index}
                          onClick={() => toggleCard(index)}
                          className="bg-black border border-zinc-700 rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition"
                        >
                          {!isFlipped ? (
                            <>
                              <p className="font-bold text-2xl mb-2">
                                ❓ {parts[0]}
                              </p>

                              <p className="text-zinc-500 text-sm">
                                Click to reveal answer 👀
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-2xl mb-4">
                                ❓ {parts[0]}
                              </p>

                              <div className="text-zinc-300 text-lg">
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                >
                                  {parts[1]}
                                </ReactMarkdown>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {plan}
              </ReactMarkdown>
            )}
          </div>

          <div className="flex gap-4 mt-4 flex-wrap">
            <button
              onClick={copyPlan}
              className="bg-white text-black px-4 py-2 rounded-xl font-bold hover:bg-gray-300 transition cursor-pointer"
            >
              {copied ? "Copied! ✅" : "Copy Plan 📋"}
            </button>

            <button
              onClick={downloadPDF}
              className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-600 transition cursor-pointer"
            >
              Download PDF 📄
            </button>
          </div>
        </div>
      )}
    </main>
  );
} 