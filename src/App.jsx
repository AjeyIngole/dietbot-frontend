import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const QUICK_PROMPTS = [
  "I just started gym, give me a 1-day diet plan",
  "High-protein breakfast ideas",
  "Weekly meal prep plan for fat loss",
  "Budget-friendly Indian diet plan",
];

const DIETS = ["vegetarian", "vegan", "eggetarian", "non-vegetarian", "keto", "high-protein"];

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm **DietBot** 🥗\n\nTell me your goal, pick your diet type and calories above, and I'll create a personalized plan for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [diet, setDiet] = useState("vegetarian");
  const [calories, setCalories] = useState(2000);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Keep the latest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const prompt = text.trim();
    if (!prompt || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          dietaryPreferences: diet,
          targetCalories: Number(calories),
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.responseText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          error: true,
          text: `⚠️ Couldn't reach the server (${err.message}). It may be waking up, so please try again in a few seconds.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl">🥗</div>
          <div>
            <h1 className="text-lg font-semibold">DietBot</h1>
            <p className="text-xs text-slate-500">AI-powered diet planner</p>
          </div>
        </div>

        {/* Preferences */}
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 pb-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-slate-500">Diet</span>
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 capitalize focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {DIETS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-slate-500">Calories</span>
            <input
              type="number"
              min="1000"
              max="5000"
              step="100"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-24 rounded-lg border border-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <span className="text-slate-500">kcal</span>
          </label>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  m.role === "user"
                    ? "bg-emerald-600 text-white"
                    : m.error
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-slate-200 bg-white"
                }`}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none prose-headings:mb-2 prose-headings:mt-4">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                <span className="animate-pulse">Preparing your diet plan… this can take up to a minute ⏳</span>
              </div>
            </div>
          )}

          {/* Quick suggestions, shown until the user sends their first message */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-2 pt-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="border-t border-slate-200 bg-white">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. I want to lose 5 kg, give me a weekly plan"
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
        <p className="pb-3 text-center text-xs text-slate-400">
          General wellness guidance only, not medical advice. Consult a professional for health conditions.
        </p>
      </footer>
    </div>
  );
}