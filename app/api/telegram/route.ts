import { NextResponse } from "next/server";

const CODES = ["CL", "PL", "PD", "FL1", "SA", "BL1"];

const AIDE =
  "🐙 Salut, je suis Polo le Poulpe !\n\n" +
  "Donne-moi des options séparées par des virgules, je choisis :\n" +
  "/choix Arsenal, PSG, Real\n\n" +
  "Avec contexte, compétition et match nul (facultatifs) :\n" +
  "/choix Arsenal, PSG | Qui gagne ? | CL nul\n\n" +
  "Compétitions : CL, PL, PD, FL1, SA, BL1\n\n" +
  "⚠️ Pour le fun : aucune garantie, ne parie pas d'argent.";

type MessageTelegram = {
  text?: unknown;
  chat?: { id?: unknown; type?: unknown };
};

async function envoyer(token: string, chatId: number, texte: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: texte }),
    });
  } catch (e) {
    console.error("Telegram envoi", e);
  }
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!token || !secret) {
    console.error("Variables Telegram absentes");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as {
    message?: MessageTelegram;
  } | null;
  const message: MessageTelegram = update?.message ?? {};
  const chatId = message.chat?.id;
  const texte: string =
    typeof message.text === "string" ? message.text.trim() : "";

  if (typeof chatId !== "number" || !texte) {
    return NextResponse.json({ ok: true });
  }

  const prive: boolean = message.chat?.type === "private";
  const commande: RegExpMatchArray | null = texte.match(
    /^\/(\w+)(?:@\w+)?\s*([\s\S]*)$/
  );
  const nom: string = commande ? commande[1].toLowerCase() : "";
  const reste: string = commande ? commande[2].trim() : texte;

  if (nom === "start" || nom === "help" || nom === "aide") {
    await envoyer(token, chatId, AIDE);
    return NextResponse.json({ ok: true });
  }

  const estChoix: boolean =
    nom === "choix" || (!commande && prive && texte.includes(","));

  if (!estChoix) {
    if (commande || prive) {
      await envoyer(token, chatId, "Je n'ai pas compris. Essaie /aide 🐙");
    }
    return NextResponse.json({ ok: true });
  }

  const parties: string[] = reste.split("|").map((s: string) => s.trim());
  const options: string[] = (parties[0] || "")
    .split(",")
    .map((o: string) => o.trim())
    .filter(Boolean);
  const contexte: string = parties[1] || "";
  const reglages: string[] = (parties[2] || "").toUpperCase().split(/\s+/);
  const competition: string = CODES.find((c) => reglages.includes(c)) ?? "";
  const nul: boolean = reglages.includes("NUL");

  if (options.length < 2) {
    await envoyer(
      token,
      chatId,
      "Donne-moi au moins 2 options séparées par des virgules.\nExemple : /choix Arsenal, PSG"
    );
    return NextResponse.json({ ok: true });
  }

  try {
    const origin = new URL(request.url).origin;
    const res = await fetch(`${origin}/api/choix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options, contexte, competition, nul }),
    });
    const data = (await res.json()) as {
      choix?: string;
      phrase?: string;
      source?: string;
      donnees?: boolean;
      error?: string;
    };

    if (!res.ok) {
      await envoyer(token, chatId, data.error ?? "Polo n'a pas compris.");
    } else {
      const badges =
        (data.source === "ia" ? "\n✨ avis de l'IA" : "") +
        (data.donnees ? "\n📊 avec le classement" : "");
      await envoyer(
        token,
        chatId,
        `🐙 Polo choisit : ${data.choix}\n« ${data.phrase} »${badges}\n\n⚠️ Pour le fun, aucune garantie.`
      );
    }
  } catch (e) {
    console.error("Telegram appel choix", e);
    await envoyer(token, chatId, "Polo s'est perdu dans les profondeurs 🌊");
  }

  return NextResponse.json({ ok: true });
}
