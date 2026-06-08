"use client";
import {
  UserButton,
  SignInButton,
  useUser,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabase";
export default function Home() {
  const { isSignedIn, user } = useUser();
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
const [currentQuestion, setCurrentQuestion] = useState(0);
const [score, setScore] = useState(0);
const [selectedAnswer, setSelectedAnswer] = useState("");
const [quizFinished, setQuizFinished] = useState(false);
  const [subject, setSubject] = useState("");
  const [usageCount, setUsageCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  useEffect(() => {
  if (!user?.id) return;

  async function loadUser() {
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", user!.id)
      .maybeSingle();

    if (!existingUser) {
      await supabase
        .from("users")
        .insert({
          id: user!.id,
          email: user!.primaryEmailAddress?.emailAddress,
          premium: false,
          generations_used: 0,
        });

      setIsPremium(false);
      setUsageCount(0);
    } else {
      setIsPremium(existingUser.premium);
      setUsageCount(existingUser.generations_used);
    }
  }

  loadUser();
}, [user]);
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
  async function generatePlan() {
  if (!isPremium && usageCount >= 3) {
    alert("Free limit reached. Upgrade to Premium.");
    return;
  }

  if (cooldown) return;

  try {
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

    const quizSection =
  data.plan.split("QUIZ")[1];

if (quizSection) {
  const blocks = quizSection
    .split(/\d+\./)
    .filter((b: string) => b.trim());

  const parsed = blocks.map(
    (block: string) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    return {
      question: lines[0],
      options: lines
        .filter(
          (l) =>
            l.startsWith("A)") ||
            l.startsWith("B)") ||
            l.startsWith("C)") ||
            l.startsWith("D)")
        ),
      correct:
        lines.find((l) =>
          l.startsWith("Correct:")
        ) || "",
    };
  });

  setQuizQuestions(parsed);
}

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

    if (user?.id) {
  const newUsage = usageCount + 1;

  await supabase
    .from("users")
    .update({
      generations_used: newUsage,
    })
    .eq("id", user.id);

  setUsageCount(newUsage);
}

  } catch (error) {
    console.error(error);
    alert("Something went wrong.");
  } finally {
    setLoading(false);
  }
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
<div className="absolute top-6 right-6 z-50">
  {!isSignedIn ? (
    <SignInButton mode="modal">
      <button className="bg-white text-black px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition cursor-pointer">
        Sign In
      </button>
    </SignInButton>
  ) : (
    <UserButton />
  )}
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
      <div className="text-center mb-10">
  <h2 className="text-5xl font-black text-white mb-4">
    Study Smarter with AI
  </h2>

  <p className="text-zinc-400 text-lg max-w-xl">
    Generate personalized study plans, quizzes and flashcards powered by AI.
  </p>
</div>

{!plan && history.length === 0 && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 w-full max-w-4xl">
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300">
      <div className="text-4xl mb-3">📚</div>

      <h3 className="font-bold text-xl mb-2">
        AI Study Plans
      </h3>

      <p className="text-zinc-400">
        Personalized plans generated instantly.
      </p>
    </div>

    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300">
      <div className="text-4xl mb-3">🧠</div>

      <h3 className="font-bold text-xl mb-2">
        Smart Flashcards
      </h3>

      <p className="text-zinc-400">
        Learn faster with active recall.
      </p>
    </div>

    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-cyan-400 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300">
      <div className="text-4xl mb-3">⚡</div>

      <h3 className="font-bold text-xl mb-2">
        Quiz Mode
      </h3>

      <p className="text-zinc-400">
        Test your knowledge instantly.
      </p>
    </div>
  </div>
)}
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
          className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300 disabled:opacity-50 cursor-pointer"
        >
          {loading
            ? "⏳ Generating..."
            : cooldown
            ? "Wait 5s..."
            : "Generate Study Plan"}
        </button>
        <p className="text-zinc-500 text-sm text-center mt-2">
  {isPremium ? (
  <span className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full font-bold shadow-lg animate-pulse">
    🚀 Premium Active
  </span>
) : (
  <>Free plan: {Math.max(0, 3 - usageCount)} generations left</>
)}
  {!isPremium && (
  <button
  onClick={async () => {
    if (!user) {
  alert("Please sign in first.");
  return;
}
if (!user) {
  alert("Please sign in first.");
  return;
}
  const response = await fetch("/api/checkout", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: user?.primaryEmailAddress?.emailAddress,
    userId: user?.id,
  }),
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
  ?.split("QUIZ")[0]
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
              {quizQuestions.length > 0 && (
  <div className="mt-10 bg-black border border-zinc-700 p-6 rounded-2xl">
    <h2 className="text-3xl font-bold mb-6">
      Quiz Mode ⚡
    </h2>

    {!quizFinished ? (
      <>
        <h3 className="text-2xl font-bold mb-6">
          {
            quizQuestions[currentQuestion]
              ?.question
          }
        </h3>

        <div className="flex flex-col gap-3">
          {quizQuestions[
            currentQuestion
          ]?.options.map(
            (option: string, i: number) => (
              <button
                key={i}
                onClick={() => {
                  if (selectedAnswer) return;

                  setSelectedAnswer(option);

                  const isCorrect =
                    quizQuestions[
                      currentQuestion
                    ].correct.includes(
                      option.charAt(0)
                    );

                  if (isCorrect) {
                    setScore((prev) => prev + 1);
                  }

                  setTimeout(() => {
                    setSelectedAnswer("");

                    if (
                      currentQuestion + 1 <
                      quizQuestions.length
                    ) {
                      setCurrentQuestion(
                        (prev) => prev + 1
                      );
                    } else {
                      setQuizFinished(true);
                    }
                  }, 1200);
                }}
                className={`p-4 rounded-xl text-left font-semibold transition ${
                  selectedAnswer === option
                    ? quizQuestions[
                        currentQuestion
                      ].correct.includes(
                        option.charAt(0)
                      )
                      ? "bg-green-600"
                      : "bg-red-600"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {option}
              </button>
            )
          )}
        </div>

        <p className="mt-5 text-zinc-400">
          Question {currentQuestion + 1} /{" "}
          {quizQuestions.length}
        </p>
      </>
    ) : (
      <div>
        <h3 className="text-3xl font-bold">
          Final Score: {score}/
          {quizQuestions.length}
        </h3>

        <button
          onClick={() => {
            setCurrentQuestion(0);
            setScore(0);
            setQuizFinished(false);
          }}
          className="mt-6 bg-blue-500 px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition"
        >
          Retry Quiz
        </button>
      </div>
    )}
  </div>
)}
            </>
          ) : (
            <ReactMarkdown
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