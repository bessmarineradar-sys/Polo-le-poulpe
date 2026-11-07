"use client";

import { useState } from "react";

export default function Home() {
  const [options, setOptions] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!options.trim()) return;

    setLoading(true);
    setResult(null);
    setIsError(false);

    try {
      const res = await fetch("/api/choix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          options: options
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data.choix);
      } else {
        setIsError(true);
        setResult(data.error ?? "Polo n'a pas compris.");
      }
    } catch {
      setIsError(true);
      setResult("Impossible de contacter Polo 🐙");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="floating">🐙</div>

      <div className="card">
        <h1 className="title">Polo le Poulpe</h1>
        <p className="subtitle">L'oracle marin qui ne se trompe jamais</p>

        <label className="label" htmlFor="options">
          Tes options (séparées par des virgules)
        </label>
        <input
          id="options"
          className="input"
          type="text"
          value={options}
          onChange={(e) => setOptions(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePredict()}
          placeholder="Ex: Pizza, Sushi, Burger..."
        />

        <button
          className="button"
          onClick={handlePredict}
          disabled={loading || !options.trim()}
        >
          {loading ? "Polo réfléchit... 🤔" : "🐙 Polo, ton choix !"}
        </button>

        {result && (
          <div className={isError ? "result error" : "result"}>
            <p className="result-label">
              {isError ? "Oups" : "La réponse de l'océan"}
            </p>
            <p className="result-text">{result}</p>
          </div>
        )}
      </div>
    </main>
  );
}
