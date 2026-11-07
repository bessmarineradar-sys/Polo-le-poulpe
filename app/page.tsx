"use client";

import { useEffect, useState } from "react";

type Choix = { choix: string; phrase: string; source: "ia" | "hasard" };

const CLE_HISTORIQUE = "polo-historique";

export default function Home() {
  const [options, setOptions] = useState("");
  const [contexte, setContexte] = useState("");
  const [result, setResult] = useState<Choix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historique, setHistorique] = useState<Choix[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CLE_HISTORIQUE);
      if (saved) setHistorique(JSON.parse(saved));
    } catch {}
  }, []);

  const sauverHistorique = (liste: Choix[]) => {
    setHistorique(liste);
    try {
      localStorage.setItem(CLE_HISTORIQUE, JSON.stringify(liste));
    } catch {}
  };

  const handlePredict = async () => {
    if (!options.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/choix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          options: options
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean),
          contexte,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        sauverHistorique([data, ...historique].slice(0, 5));
      } else {
        setError(data.error ?? "Polo n'a pas compris.");
      }
    } catch {
      setError("Impossible de contacter Polo 🐙");
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

        <div className="field">
          <label className="label" htmlFor="contexte">
            Contexte (facultatif)
          </label>
          <input
            id="contexte"
            className="input"
            type="text"
            value={contexte}
            onChange={(e) => setContexte(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePredict()}
            placeholder="Ex: Il pleut et j'ai très faim"
          />
        </div>

        <button
          className="button"
          onClick={handlePredict}
          disabled={loading || !options.trim()}
        >
          {loading ? "Polo réfléchit... 🤔" : "🐙 Polo, ton choix !"}
        </button>

        {error && (
          <div className="result error">
            <p className="result-label">Oups</p>
            <p className="result-text">{error}</p>
          </div>
        )}

        {result && (
          <div className="result">
            <p className="result-label">La réponse de l'océan</p>
            <p className="result-text">{result.choix}</p>
            <p className="phrase">{result.phrase}</p>
            {result.source === "ia" && (
              <span className="badge">✨ avis de l'IA</span>
            )}
          </div>
        )}

        {historique.length > 0 && (
          <div className="history">
            <div className="history-head">
              <p className="history-title">Derniers choix</p>
              <button
                className="link-button"
                onClick={() => sauverHistorique([])}
              >
                Effacer
              </button>
            </div>
            <ul>
              {historique.map((h, i) => (
                <li key={i}>
                  <strong>{h.choix}</strong>
                  <span>{h.phrase}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
