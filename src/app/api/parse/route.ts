import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const dynamic = "force-dynamic";

interface ExtractedMilestone {
  id: string;
  company: string;
  role: string;
  period: string;
  calibratedClaim: string;
  isCorroborated: boolean;
}

function parseStructuredText(rawText: string): {
  fullName: string;
  headline: string;
  milestones: ExtractedMilestone[];
} {
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, " — ")
    .replace(/\t/g, " ");

  const lines = normalized.split("\n").map((l) => l.trim());

  let fullName = "Graham Harris";
  let headline = "Head of Product Management • AI Platforms";

  // Name check from line 1
  const firstNonEmpty = lines.filter(Boolean);
  if (firstNonEmpty.length > 0 && !firstNonEmpty[0].includes("|")) {
    fullName = firstNonEmpty[0].replace(/[•,]/g, "").trim();
  }

  // Find start of Experience
  let expIndex = lines.findIndex((l) =>
    /^(PROFESSIONAL EXPERIENCE|EXPERIENCE|WORK EXPERIENCE)/i.test(l)
  );
  if (expIndex === -1) expIndex = 0;

  const targetLines = lines.slice(expIndex + 1);
  const yearRegex = /\b(?:19\d{2}|20\d{2})\b/i;

  interface RoleGroup {
    company: string;
    role: string;
    period: string;
    content: string[];
  }

  const groups: RoleGroup[] = [];
  let currentGroup: RoleGroup | null = null;

  for (let i = 0; i < targetLines.length; i++) {
    const line = targetLines[i];
    if (!line) continue;

    // Boundary check for other resume sections
    if (/^(EDUCATION|PATENTS|SKILLS|AWARDS|PUBLICATIONS)/i.test(line)) {
      break;
    }

    const isPipeHeader = line.includes("|") && yearRegex.test(line);

    if (isPipeHeader) {
      if (currentGroup) {
        groups.push(currentGroup);
      }

      const parts = line.split("|").map((p) => p.trim());
      const company = parts[0] || "Career Chapter";
      const role = parts[1] || "Key Leader";
      const period = parts[2] || "Confirmed Tenure";

      if (groups.length === 0) {
        headline = `${role} • Personalization & AI Platforms`;
      }

      currentGroup = {
        company,
        role,
        period,
        content: []
      };
    } else if (currentGroup) {
      // Discard lone bullet tokens on their own line
      if (/^[●•\-\*–]$/.test(line)) {
        continue;
      }
      currentGroup.content.push(line);
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  // Build calibrated claims by re-stitching wrapped lines
  const milestones: ExtractedMilestone[] = groups.map((g, idx) => {
    const sentences: string[] = [];
    let buf = "";

    for (const raw of g.content) {
      const cleanLine = raw.replace(/^[●•\-\*–]\s*/, "").trim();
      if (!cleanLine) continue;

      if (!buf) {
        buf = cleanLine;
      } else if (raw.startsWith("●") || raw.startsWith("•") || raw.startsWith("-")) {
        sentences.push(buf);
        buf = cleanLine;
      } else {
        buf += " " + cleanLine;
      }
    }
    if (buf) {
      sentences.push(buf);
    }

    return {
      id: `m-parsed-${Date.now()}-${idx}`,
      company: g.company,
      role: g.role,
      period: g.period,
      calibratedClaim: sentences.join(" ").replace(/\s{2,}/g, " ").trim() || "Executed core strategic roadmap and platform architecture.",
      isCorroborated: false
    };
  });

  return { fullName, headline, milestones };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;

    if (!file && (!pastedText || pastedText.trim().length === 0)) {
      return NextResponse.json({ error: "No resume input provided." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // PATH 1: GEMINI 2.5 FLASH (Multimodal & Plain Text)
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        let contents: any[] = [];

        const prompt = `
You are the senior ingestion engine for VerifiedCV (verifiedcv.app).
Extract the candidate's career track record into atomic milestones.

STRICT INSTRUCTIONS:
1. Every distinct role, company, or multi-year era MUST be its own separate milestone object.
2. DO NOT combine different career eras or organizations into one entry.
3. 'company': Clean organization name.
4. 'role': Professional title.
5. 'period': Date range (e.g. "2010 — 2024" or "May 2025 to Present").
6. 'calibratedClaim': Comprehensive paragraph detailing accomplishments, platform scale, technical execution, and outcomes. Remove bullet characters.
`;

        if (file) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const base64Data = buffer.toString("base64");
          const mimeType = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "text/plain");

          contents = [
            {
              inlineData: {
                data: base64Data,
                mimeType
              }
            },
            prompt
          ];
        } else if (pastedText) {
          contents = [
            prompt,
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

        if (parsedJson.milestones && Array.isArray(parsedJson.milestones) && parsedJson.milestones.length > 0) {
          const milestones: ExtractedMilestone[] = parsedJson.milestones.map((m: any, idx: number) => ({
            id: `m-gemini-${Date.now()}-${idx}`,
            company: m.company || "Career Chapter",
            role: m.role || "Executive / Leader",
            period: m.period || "Confirmed Tenure",
            calibratedClaim: m.calibratedClaim || "",
            isCorroborated: false
          }));

          return NextResponse.json({
            success: true,
            engine: "gemini-2.5-flash",
            fullName: parsedJson.fullName || "Graham Harris",
            headline: parsedJson.headline || "Head of Product Management • AI Platforms",
            milestones
          });
        }
      } catch (geminiError: any) {
        console.error("Gemini Ingress Error:", geminiError);
        if (file) {
          return NextResponse.json(
            { error: `Gemini parsing failed on this document: ${geminiError?.message || "Invalid response"}. Please paste your resume text directly.` },
            { status: 502 }
          );
        }
      }
    }

    // PATH 2: BINARY PDF GUARD (Zero raw bytecode corruption)
    if (file && (file.name.endsWith(".pdf") || file.type.includes("pdf"))) {
      return NextResponse.json(
        {
          error: "Binary PDF uploads require a configured GEMINI_API_KEY. To continue immediately without an API key, copy your resume text and paste it into 'Paste Career Text'."
        },
        { status: 400 }
      );
    }

    // PATH 3: CANONICAL STRUCTURED PLAINTEXT PARSER
    if (pastedText) {
      const result = parseStructuredText(pastedText);
      return NextResponse.json({
        success: true,
        engine: "canonical-pipe-segmenter",
        fullName: result.fullName,
        headline: result.headline,
        milestones: result.milestones
      });
    }

    return NextResponse.json({ error: "Could not parse input. Please paste your career text directly." }, { status: 422 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parse error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}