import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const PRIMARY_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export async function POST(req: NextRequest) {
  try {
    const { messages, experiences, summary, skills, education, certifications, isSaved } = await req.json();

    // Build an ultra-compact, high-density Career Digest so CV Ally knows EVERY role
    const careerDigest = (experiences || []).map((exp: any, i: number) => {
      const topClaims = (exp.claims || [])
        .slice(0, 3)
        .map((c: any) => `• [${c.category}] ${c.metric_summary ? c.metric_summary + ': ' : ''}${c.raw_bullet}`)
        .join("\n    ");
      return `[${i + 1}] ${exp.company_name} | ${exp.title} (${exp.start_date} - ${exp.end_date || "Present"})\n    ${topClaims}`;
    }).join("\n\n");

    const systemPrompt = `You are CV Ally, the candidate co-pilot and forensic strategist for Project PITH (usepith.app).
Your mission is to help the candidate turn their real career history into an indisputable, peer-backed proof dossier for recruiters.

CANDIDATE DOSSIER CONTEXT:
- Total Experiences Extracted: ${experiences?.length || 0}
- Vault Committed & Active: ${isSaved ? "YES" : "NO (Draft Mode)"}
${summary ? `- Summary: ${summary}` : ""}
${skills && skills.length > 0 ? `- Skills: ${skills.map((s: any) => s.name).join(", ")}` : ""}

COMPLETE INGESTED CAREER HISTORY:
${careerDigest || "No experiences uploaded yet."}

INSTRUCTIONS:
1. You have complete knowledge of the candidate's career history above. When they ask about specific companies, dates, or achievements, refer to them accurately.
2. If the candidate asks why a role is missing or wants to re-upload, acknowledge it directly and offer the upload action (action.type = "FILE_UPLOAD").
3. If they select or ask to edit a specific claim, give them constructive options: strengthen the metric, calibrate phrasing, or propose who to ask for corroboration.
4. Keep replies crisp, authentic, empowering, and respectful. Avoid buzzwords.

Respond ONLY in valid JSON matching this schema:
{
  "reply": "Your conversational message to the candidate.",
  "action": {
    "type": "FILE_UPLOAD" | "NONE",
    "label": "Button text or null"
  }
}`;

    const formattedMessages = (messages || []).map((m: any) => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));

    const completion = await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedMessages,
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

    return NextResponse.json({
      success: true,
      reply: parsed.reply || "I am ready to help you calibrate your track record.",
      action: parsed.action?.type !== "NONE" ? parsed.action : null,
    });
  } catch (error: any) {
    console.error("CV Ally Chat Error:", error);
    return NextResponse.json(
      { error: error.message || "CV Ally encountered a processing error." },
      { status: 500 }
    );
  }
}