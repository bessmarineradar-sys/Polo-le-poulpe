import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const options: string[] = Array.isArray(body?.options)
    ? body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
    : [];

  if (options.length < 2) {
    return NextResponse.json(
      { error: "Donne-moi au moins 2 options." },
      { status: 400 }
    );
  }

  const choix = options[Math.floor(Math.random() * options.length)];
  return NextResponse.json({ choix });
}
