"use client";
import {
  UserButton,
  SignInButton,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import jsPDF from "jspdf";
export default function Home() {
  const [subject, setSubject] = useState("");
  const [usageCount, setUsageCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  useEffect(() => {
  const premium =
    localStorage.getItem("premium");

  if (premium === "true") {
    setIsPremium(true);
  }
}, []);
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("studyHistory");

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);
  useEffect(() => {
  const savedUsage = localStorage.getItem("usageCount");

  if (savedUsage) {
    setUsageCount(Number(savedUsage));
  }
}, []);

  async function generatePlan() {
    if (!isPremium && usageCount >= 3) {
  alert("Free limit reached. Upgrade to Premium.");
  return;
}
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
    date: new Date().toLocaleDateString(),
    favorite: false,
  },
  ...history,
].slice(0, 20);

    setHistory(newHistory);

    localStorage.setItem(
      "studyHistory",
      JSON.stringify(newHistory)
    );

    const newUsage = usageCount + 1;

setUsageCount(newUsage);

localStorage.setItem(
  "usageCount",
  String(newUsage)
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

function toggleFavorite(index: number) {
  const updatedHistory = [...history];

  updatedHistory[index].favorite =
    !updatedHistory[index].favorite;

  setHistory(updatedHistory);

  localStorage.setItem(
    "studyHistory",
    JSON.stringify(updatedHistory)
  );
}

function deleteHistoryItem(indexToDelete: number) {
  const updatedHistory = history.filter(
    (_, index) => index !== indexToDelete
  );

  setHistory(updatedHistory);

  localStorage.setItem(
    "studyHistory",
    JSON.stringify(updatedHistory)
  );
}

  function downloadPDF() {
  const doc = new jsPDF();

  const margin = 15;
  const maxWidth = 180;
  const pageHeight = doc.internal.pageSize.height;

  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AI Study Plan", margin, y);

  y += 15;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const cleanedPlan = plan
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\\frac{([^}]*)}{([^}]*)}/g, "($1 / $2)")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\cdot/g, "·")
    .replace(/\\times/g, "×")
    .replace(/[{}]/g, "")
    .replace(/\\/g, "")
    .replace(/\$/g, "");

  const paragraphs = cleanedPlan
  .split("\n")
  .filter((p) => p.trim() !== "");

  paragraphs.forEach((paragraph) => {
    const lines = doc.splitTextToSize(paragraph, maxWidth);

    lines.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.text(line, margin, y);
      y += 6;
    });

    y += 4;
  });

  doc.save(`${subject}-${topic}-study-plan.pdf`);
}

  return (
    <>
<div className="absolute top-4 right-4 z-50 flex gap-3">
  <SignInButton />
  <UserButton />
</div>
    <main
  className={`min-h-screen ${
    !plan && history.length === 0
      ? "flex flex-col items-center justify-center"
      : "flex flex-col lg:flex-row gap-6"
  }`}
>

      <div
  className={`flex flex-col items-center ${
    !plan && history.length === 0
      ? ""
      : "flex-1"
  }`}
>
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
        <p className="text-zinc-500 text-sm text-center mt-2">
  {isPremium
  ? "Premium Active 🚀"
  : `Free plan: ${3 - usageCount} generations left`}
  {!isPremium && (
  <button
  onClick={async () => {
  setIsPremium(true);
  localStorage.setItem("premium", "true");

  const response = await fetch("/api/checkout", {
    method: "POST",
  });

  const data = await response.json();

  window.location.href = data.url;
}}
  className="mt-4 bg-yellow-500 text-black px-6 py-2 rounded-xl font-bold hover:bg-yellow-400 transition cursor-pointer"
>
  Upgrade to Premium 🚀
</button>
)}
</p>
      </div>

</div>
      <div className="w-full flex flex-col lg:flex-row gap-6 mt-10 max-w-7xl">

  {history.length > 0 && (
    <div className="w-full lg:w-[300px] lg:min-w-[300px] h-auto lg:max-h-[90vh] bg-zinc-900 rounded-2xl p-5 shadow-2xl overflow-hidden">
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
  History 🕒 ({history.length})
</h2>

        <button
          onClick={clearHistory}
          className="bg-red-500 px-3 py-2 rounded-xl font-bold hover:bg-red-600 transition cursor-pointer"
        >
          Clear
        </button>
      </div>

      <input
  type="text"
  placeholder="🔍 Search history..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full p-3 mb-3 rounded-xl bg-black border border-zinc-700 text-white"
/>
      <div className="flex flex-col gap-3 overflow-y-auto h-[calc(90vh-100px)] pr-2">
        {[...history]
  .sort((a, b) =>
    Number(b.favorite) - Number(a.favorite)
  )
  .filter(
    (item) =>
      item.subject
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.topic
        .toLowerCase()
        .includes(search.toLowerCase())
  )
  .map((item, index) => (
          <div
  key={index}
  className="relative bg-black border border-zinc-700 rounded-2xl p-4 hover:border-zinc-400 hover:scale-[1.02] transition cursor-pointer"
>
  <button
    onClick={() => loadHistory(item.plan)}
    className="w-full text-left cursor-pointer"
  >
    <p className="font-bold text-2xl">
      {item.subject}
    </p>

    <p className="text-zinc-400">
      {item.topic}
    </p>

    <p className="text-zinc-500 text-sm">
  {item.level}
</p>

<p className="text-zinc-600 text-xs mt-1">
  {item.date}
</p>
  </button>

  <button
    onClick={() => toggleFavorite(index)}
    className="absolute top-3 right-10 text-yellow-400 text-lg cursor-pointer hover:scale-125 transition"
  >
    {item.favorite ? "⭐" : "☆"}
  </button>

  <button
  onClick={() => deleteHistoryItem(index)}
  className="absolute top-3 right-3 text-red-500 hover:text-red-400 text-lg cursor-pointer hover:scale-125 transition"
>
  🗑️
</button>
</div>
        ))}
      </div>
    </div>
  )}

{!plan && history.length > 0 && (
  <div className="bg-zinc-900 p-6 rounded-2xl w-full shadow-2xl flex flex-col items-center justify-center min-h-[500px]">
    <div className="text-center">
      <div className="text-6xl mb-4">📚</div>

      <h2 className="text-3xl font-bold mb-4">
        Select a Study Plan
      </h2>

      <p className="text-zinc-400 text-lg">
        Choose a plan from History
      </p>

      <p className="text-zinc-500 mt-2">
        or generate a new one.
      </p>
    </div>
  </div>
)}

<div className="flex-1 w-full max-w-5xl">
    {plan && (
      <div className="bg-zinc-900 p-6 rounded-2xl w-full shadow-2xl">

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
<button
  onClick={() => {
  setQuizMode(!quizMode);

  if (!quizMode) {
    setQuizIndex(0);
  }
}}
  className="mb-4 bg-blue-500 px-4 py-2 rounded-xl font-bold hover:bg-blue-600 transition cursor-pointer"
>
  {quizMode ? "Exit Quiz" : "Start Quiz"}
</button>
{quizMode && (
  <p className="mb-4 text-zinc-400">
    Question {quizIndex + 1} / {
  plan
    .split("FLASHCARDS")[1]
    ?.split("Q:")
    .filter(
      (card) =>
        card.trim() !== "" &&
        card.includes("A:")
    ).length
}
  </p>
)}
{quizMode && (
  <div className="flex gap-3 mb-4">
    <button
      onClick={() => {
        if (quizIndex > 0) {
          setQuizIndex(quizIndex - 1);
        }
      }}
      className="bg-zinc-700 px-4 py-2 rounded-xl font-bold hover:bg-zinc-600 transition cursor-pointer"
    >
      Previous
    </button>

    <button
      onClick={() => {
        const totalQuestions = plan
          .split("FLASHCARDS")[1]
          ?.split("Q:")
          .filter(
            (card) =>
              card.trim() !== "" &&
              card.includes("A:")
          ).length || 0;

        if (quizIndex < totalQuestions - 1) {
          setQuizIndex(quizIndex + 1);
        }
      }}
      className="bg-green-500 px-4 py-2 rounded-xl font-bold hover:bg-green-600 transition cursor-pointer"
    >
      Next Question
    </button>
  </div>
)}
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
                    if (quizMode && index !== quizIndex) return null;
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

  </div>

</div>
</main>
</>
);
}