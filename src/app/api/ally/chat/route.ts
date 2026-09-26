import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getGroqClient(): OpenAI | null {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  return new OpenAI({
    apiKey,
    baseURL: process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined,
  });
}

export async function POST(req: NextRequest) {
  try {
    const groq = getGroqClient();

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { messages = [], experiences = [], summary = "", skills = [] } = body || {};

    if (!groq) {
      return NextResponse.json({
        success: true,
        reply: "CV Ally is connected. To enable live inference, provide GROQ_API_KEY or OPENAI_API_KEY in your Vercel environment variables. In the meantime, you can calibrate claims and invite chapter corroborators.",
      });
    }

    const activeChapters = Array.isArray(experiences)
      ? experiences
          .map((e: any) => `${e.title || "Role"} @ ${e.company_name || "Company"} (${e.start_year || ""}-${e.end_year || "Present"})`)
          .join("; ")
      : "None listed";

    const keySkills = Array.isArray(skills)
      ? skills.map((s: any) => s.name || "").filter(Boolean).join(", ")
      : "None listed";

    const contextPrompt = `You are CV Ally, the forensic trust copilot for VerifiedCV (verifiedcv.app).
Your mission: Help authentic candidates calibrate high-impact claims, uncover unstated operational constraints, and prepare their career chapters for peer corroboration.
Tone: Grounded, authentic peer, concise, high technical literacy. Zero boilerplate buzzwords.

Candidate Context:
- Summary: ${summary || "Not specified"}
- Active Chapters: ${activeChapters}
- Key Skills: ${keySkills}`;

    const chatCompletion = await groq.chat.completions.create({
      model: process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-4o-mini",
      messages: [
        { role: "system", content: contextPrompt },
        ...messages.map((m: any) => ({
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content || "",
        })),
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "I audited your latest inputs. How else can we strengthen your proof signals?";

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error("CV Ally chat handler error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "CV Ally service temporarily unavailable." },
      { status: 500 }
    );
  }
}