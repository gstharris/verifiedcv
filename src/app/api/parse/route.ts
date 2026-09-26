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

// Clean plaintext fallback segmenter for plain text pastes only (never runs on binary PDFs)
function parsePlainTextFallback(text: string): {
  fullName: string;
  headline: string;
  milestones: ExtractedMilestone[];
} {
  const clean = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, " - ")
    .replace(/\t/g, " ")
    .trim();

  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  let fullName = "Graham Harris";
  let headline = "Product Leader • AI Platforms";

  if (lines.length > 0 && lines[0].length < 45 && !/\d{4}/.test(lines[0])) {
    fullName = lines[0].replace(/[|•,]/g, "").trim();
  }
  if (lines.length > 1 && lines[1].length < 80 && !/\d{4}/.test(lines[1])) {
    headline = lines[1].replace(/[|•]/g, "").trim();
  }

  // Strict date range matcher (requires two dates or a date + Present)
  const rangeRegex = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b\s*(?:-|–|—|to)\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b|present|current)/i;

  const milestones: ExtractedMilestone[] = [];
  let currentCompany = "";
  let currentRole = "";
  let currentPeriod = "";
  let currentPoints: string[] = [];

  const flush = () => {
    if (currentCompany || currentRole || currentPoints.length > 0) {
      milestones.push({
        id: `m-fallback-${Date.now()}-${milestones.length}`,
        company: currentCompany || "Career Chapter",
        role: currentRole || "Leader",
        period: currentPeriod || "Confirmed Tenure",
        calibratedClaim: currentPoints.join(" ").replace(/^[•\-\*–]\s*/g, "").trim() || "Executed core business and technical leadership.",
        isCorroborated: false
      });
      currentCompany = "";
      currentRole = "";
      currentPeriod = "";
      currentPoints = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK HISTORY|SUMMARY|EDUCATION)$/i.test(line)) continue;

    const match = line.match(rangeRegex);
    if (match && (line.length < 90 || line.includes("|") || line.includes("—"))) {
      flush();
      currentPeriod = match[0].trim();
      const rest = line.replace(currentPeriod, "").replace(/[|•()–—,-]/g, " ").trim();
      const parts = rest.split(/\s{2,}|\t/).filter(Boolean);

      if (parts.length >= 2) {
        currentCompany = parts[0];
        currentRole = parts[1];
      } else if (parts.length === 1) {
        currentCompany = parts[0];
        currentRole = "Executive / Leader";
      } else {
        currentCompany = (i > 0 && lines[i - 1].length < 70 && !lines[i - 1].startsWith("•")) ? lines[i - 1] : "Career Chapter";
        currentRole = "Leader";
      }
    } else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
      currentPoints.push(line.replace(/^[•\-\*]\s*/, ""));
    } else {
      if (currentPoints.length === 0 && line.length < 60 && !line.endsWith(".")) {
        if (!currentCompany) currentCompany = line;
        else if (!currentRole) currentRole = line;
        else currentPoints.push(line);
      } else {
        currentPoints.push(line);
      }
    }
  }

  flush();

  if (milestones.length <= 1 && clean.length > 150) {
    const blocks = clean.split(/\n\s*\n/).filter((b) => b.trim().length > 20);
    if (blocks.length > 1) {
      return {
        fullName,
        headline,
        milestones: blocks.map((b, idx) => ({
          id: `m-block-${Date.now()}-${idx}`,
          company: b.split("\n")[0].slice(0, 45) || `Role ${idx + 1}`,
          role: "Leader",
          period: "Tenure",
          calibratedClaim: b.split("\n").slice(1).join(" ").trim() || b,
          isCorroborated: false
        }))
      };
    }
  }

  return { fullName, headline, milestones };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;

    if (!file && (!pastedText || pastedText.trim().length === 0)) {
      return NextResponse.json({ error: "No resume file or text provided." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // DIAGNOSTIC LOGGING
    console.log("[VerifiedCV Ingress] API Key present:", Boolean(apiKey));
    console.log("[VerifiedCV Ingress] File upload:", file ? `${file.name} (${file.type}, ${file.size} bytes)` : "none");
    console.log("[VerifiedCV Ingress] Pasted text length:", pastedText ? pastedText.length : 0);

    // 1. PRIMARY PATH: GOOGLE GEMINI MULTIMODAL INGESTION
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        let contents: any[] = [];

        const promptText = `
You are the senior ingestion engine for VerifiedCV (verifiedcv.app).
Extract the candidate's career track record losslessly into structured, atomic milestones.

STRICT INSTRUCTIONS:
1. Every distinct job, company, or multi-year era MUST be its own separate milestone object.
2. DO NOT combine different career eras or organizations into one entry.
3. 'company': Clean organization name.
4. 'role': Professional title.
5. 'period': Date range (e.g. "2010 — 2024" or "2024 — Present").
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
            headline: parsedJson.headline || "Product Leader • AI Platforms",
            milestones
          });
        }
      } catch (geminiError: any) {
        console.error("[VerifiedCV Ingress] Gemini API call failed:", geminiError);
        // Do NOT silently corrupt binary PDFs with fallback string parsing
        if (file && (file.name.endsWith(".pdf") || file.type.includes("pdf"))) {
          return NextResponse.json(
            {
              error: `Gemini parsing failed on this PDF: ${geminiError?.message || "Unknown error"}. Please check GEMINI_API_KEY or paste your resume text directly.`
            },
            { status: 502 }
          );
        }
      }
    } else {
      // API Key is missing
      if (file && (file.name.endsWith(".pdf") || file.type.includes("pdf"))) {
        return NextResponse.json(
          {
            error: "GEMINI_API_KEY is not configured in your environment. PDFs cannot be parsed without Gemini. Please configure GEMINI_API_KEY in .env.local or paste plain text."
          },
          { status: 500 }
        );
      }
    }

    // 2. FALLBACK PATH: ONLY FOR PLAIN TEXT PASTES
    if (pastedText) {
      const fallbackResult = parsePlainTextFallback(pastedText);
      return NextResponse.json({
        success: true,
        engine: "plaintext-fallback",
        fullName: fallbackResult.fullName,
        headline: fallbackResult.headline,
        milestones: fallbackResult.milestones
      });
    }

    return NextResponse.json(
      { error: "Could not extract resume data. Please paste your career text directly." },
      { status: 422 }
    );
  } catch (err: unknown) {
    console.error("[VerifiedCV Ingress] Critical error:", err);
    const message = err instanceof Error ? err.message : "Parse error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}