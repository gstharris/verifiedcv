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
        reply: "Ally is ready to help you clean up wording and invite a colleague to confirm a chapter. Do not include confidential numbers from a past employer.",
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

    const contextPrompt = `You are Ally, a writing helper for VerifiedCV (verifiedcv.app).
Help candidates turn resume bullets into clear, public-safe statements and invite colleagues to confirm a chapter.
Never ask for confidential, internal, or NDA-covered metrics (latency budgets, unpublished revenue, customer names, unreleased product details, or anything an old employer would consider private).
If a user pastes that kind of detail, tell them to remove it.
Tone: warm, plain English, brief. No jargon. No interrogation.

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

    const reply = chatCompletion.choices[0]?.message?.content || "I can help clean up a bullet or invite a colleague. What should we do next?";

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