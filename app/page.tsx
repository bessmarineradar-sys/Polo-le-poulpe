"use client";

import { useState } from "react";

export default function Home() {
  const [texte, setTexte] = useState("");
  const [resultat, setResultat] = useState("");
  const [chargement, setChargement] = useState(false);

  async function demanderPolo() {
    setChargement(true);
    setResultat("");
    try {
      const options = texte.split(",");
      const reponse = await fetch("/api/choix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options }),
      });
      const data = await reponse.json();
      setResultat(
        reponse.ok ? `Polo choisit : ${data.choix} 🐙` : data.error
      );
    } catch {
      setResultat("Oups, Polo n'a pas pu répondre.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "2rem 1rem",
        fontFamily: "sans-serif",
        textAlign: "center",
      }}
    >
      <h1>Polo le Poulpe 🐙</h1>
      <p>Tape tes options séparées par des virgules.</p>
      <input
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="pizza, sushi, burger"
        style={{ width: "100%", padding: "0.75rem", fontSize: "1rem" }}
      />
      <button
        onClick={demanderPolo}
        disabled={chargement}
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        {chargement ? "Polo réfléchit..." : "Polo, ton choix !"}
      </button>
      {resultat && (
        <p style={{ marginTop: "1.5rem", fontSize: "1.25rem" }}>{resultat}</p>
      )}
    </main>
  );
}
