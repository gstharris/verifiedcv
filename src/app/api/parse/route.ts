import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in environment variables." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;

    if (!file && (!pastedText || pastedText.trim().length === 0)) {
      return NextResponse.json(
        { error: "No resume file or text provided." },
        { status: 400 }
      );
    }

    let contents: any[] = [];

    const promptText = `
You are the senior ingestion and parsing engine for VerifiedCV (verifiedcv.app).
Extract the candidate's career history losslessly into structured, atomic milestones.

Strict Extraction Rules:
1. Segment every distinct role and organization tenure into its own separate milestone.
2. 'company': Clean organization name without dates or location clutter.
3. 'role': Professional title.
4. 'period': Date range (e.g., "2010 — 2024" or "2024 — Present").
5. 'calibratedClaim': Comprehensive, cleanly formatted summary of responsibilities, achievements, and impact. Remove noisy bullet artifacts like '•' or weird formatting glyphs.
6. Do NOT invent experiences or embellish facts. Preserve all real companies, titles, sequences, and metrics losslessly.
`;

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString("base64");
      const mimeType = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "text/plain");

      contents = [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        promptText
      ];
    } else if (pastedText) {
      contents = [
        promptText,
        `Candidate Resume Content:\n"""\n${pastedText}\n"""`
      ];
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            headline: { type: Type.STRING },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  period: { type: Type.STRING },
                  calibratedClaim: { type: Type.STRING }
                },
                required: ["company", "role", "period", "calibratedClaim"]
              }
            }
          },
          required: ["fullName", "milestones"]
        }
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");

    const formattedMilestones = (parsedJson.milestones || []).map((m: any, idx: number) => ({
      id: `m-gemini-${Date.now()}-${idx}`,
      company: m.company || "Career Chapter",
      role: m.role || "Executive / Leader",
      period: m.period || "Confirmed Tenure",
      calibratedClaim: m.calibratedClaim || "",
      isCorroborated: false
    }));

    return NextResponse.json({
      success: true,
      fullName: parsedJson.fullName || "",
      headline: parsedJson.headline || "",
      milestones: formattedMilestones
    });
  } catch (err: unknown) {
    console.error("Gemini Ingress Error:", err);
    const message = err instanceof Error ? err.message : "Ingestion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}