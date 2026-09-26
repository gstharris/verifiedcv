import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import zlib from "zlib";

export const dynamic = "force-dynamic";

interface ExtractedMilestone {
  id: string;
  company: string;
  role: string;
  period: string;
  calibratedClaim: string;
  isCorroborated: boolean;
}

// 1. Native Zero-Dependency PDF Text Extractor using Node's built-in zlib
function extractTextFromPdfBuffer(buffer: Buffer): string {
  const binaryString = buffer.toString("binary");
  const extractedChunks: string[] = [];

  // Match all FlateDecode streams in the PDF using RegExp constructor to prevent escape collisions
  const streamRegex = new RegExp("<<\\/Filter\\s*\\/FlateDecode[\\s\\S]*?>>\\s*stream[\\r\\n]+([\\s\\S]*?)[\\r\\n]+endstream", "g");
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binaryString)) !== null) {
    try {
      const compressedBytes = Buffer.from(match[1], "binary");
      const decompressed = zlib.inflateSync(compressedBytes).toString("utf-8");

      const textMatches = decompressed.match(/\((.*?)\)\s*T[jJ]|\[(.*?)\]\s*TJ/g);
      if (textMatches) {
        for (const tm of textMatches) {
          const innerStrings = tm.match(/\(([^)]*)\)/g);
          if (innerStrings) {
            const line = innerStrings
              .map((s) => s.slice(1, -1).replace(/\\([()\\])/g, "$1"))
              .join(" ")
              .trim();
            if (line.length > 0) {
              extractedChunks.push(line);
            }
          }
        }
      }
    } catch {
      // Continue if an individual stream is binary image or font data
    }
  }

  if (extractedChunks.length > 0) {
    return extractedChunks.join("\n");
  }

  // Fallback: extract printable ASCII characters
  return buffer.toString("utf-8").replace(/[^\x20-\x7E\n\t]/g, " ").replace(/\s{3,}/g, "\n");
}

// 2. Text Normalizer
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, " — ")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/\t/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

// 3. Anchor-Based Career Chapter Segmenter
function segmentResumeIntoChapters(text: string): {
  fullName: string;
  headline: string;
  milestones: ExtractedMilestone[];
} {
  const clean = normalizeText(text);
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  let fullName = "Graham Harris";
  let headline = "Product Leader • Personalization & AI Platforms";

  if (lines.length > 0 && lines[0].length < 45 && !/\d{4}/.test(lines[0])) {
    fullName = lines[0].replace(/[|•,]/g, "").trim();
  }
  if (lines.length > 1 && lines[1].length < 80 && !/\d{4}/.test(lines[1])) {
    headline = lines[1].replace(/[|•]/g, "").trim();
  }

  const dateRangeRegex = /(?:(?:\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b\s*(?:—|-|–|to)\s*(?:\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b|\b(19\d{2}|20\d{2})\b\s*(?:—|-|–|to)\s*(?:Present|Current)|(?:\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\b(19\d{2}|20\d{2})\b)/i;

  interface Anchor {
    lineIndex: number;
    period: string;
    company: string;
    role: string;
  }

  const anchors: Anchor[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|HISTORY|SUMMARY|EDUCATION|SKILLS)$/i.test(line)) {
      continue;
    }

    const match = line.match(dateRangeRegex);
    if (match && (line.length < 90 || line.includes("|") || line.includes("—") || line.includes(" - "))) {
      const period = match[0].trim();
      const lineWithoutDate = line.replace(period, "").replace(/[|•()–—,-]/g, " ").trim();
      const parts = lineWithoutDate.split(/\s{2,}|\t/).filter(Boolean);

      let company = "";
      let role = "";

      if (parts.length >= 2) {
        company = parts[0].trim();
        role = parts[1].trim();
      } else if (parts.length === 1) {
        company = parts[0].trim();
        role = "Key Leader";
      } else {
        if (i > 0 && lines[i - 1].length < 75 && !lines[i - 1].startsWith("•")) {
          if (i > 1 && lines[i - 2].length < 75 && !lines[i - 2].startsWith("•")) {
            company = lines[i - 2];
            role = lines[i - 1];
          } else {
            company = lines[i - 1];
            role = "Leader";
          }
        } else {
          company = "Career Chapter";
          role = "Leader";
        }
      }

      anchors.push({ lineIndex: i, period, company, role });
    }
  }

  const milestones: ExtractedMilestone[] = [];

  for (let a = 0; a < anchors.length; a++) {
    const current = anchors[a];
    const next = anchors[a + 1];

    const startIndex = current.lineIndex + 1;
    const endIndex = next ? next.lineIndex : lines.length;

    const claimLines = lines
      .slice(startIndex, endIndex)
      .filter((l) => !/^(EXPERIENCE|WORK EXPERIENCE|EDUCATION)$/i.test(l))
      .map((l) => l.replace(/^[•\-\*–]\s*/, "").trim())
      .filter(Boolean);

    milestones.push({
      id: `m-parsed-${Date.now()}-${a}`,
      company: current.company || "Career Chapter",
      role: current.role || "Leader",
      period: current.period || "Confirmed Tenure",
      calibratedClaim: claimLines.join(" ").replace(/\s{2,}/g, " ").trim() || "Led strategic roadmaps, team leadership, and technical platform architecture.",
      isCorroborated: false
    });
  }

  if (milestones.length === 0) {
    const blocks = clean.split(/\n\s*\n/).filter((b) => b.trim().length > 25);
    blocks.forEach((block, idx) => {
      const bLines = block.trim().split("\n").filter(Boolean);
      const header = bLines[0] || `Role ${idx + 1}`;
      const rest = bLines.slice(1).join(" ").trim() || header;
      milestones.push({
        id: `m-block-${Date.now()}-${idx}`,
        company: header.slice(0, 45),
        role: "Leader",
        period: "Tenure",
        calibratedClaim: rest,
        isCorroborated: false
      });
    });
  }

  return { fullName, headline, milestones };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;

    if (!file && (!pastedText || pastedText.trim().length === 0)) {
      return NextResponse.json({ error: "No resume file or text received." }, { status: 400 });
    }

    let plaintextContent = "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.name.endsWith(".pdf") || file.type.includes("pdf")) {
        plaintextContent = extractTextFromPdfBuffer(buffer);
      } else {
        plaintextContent = buffer.toString("utf-8");
      }
    } else if (pastedText) {
      plaintextContent = pastedText;
    }

    const cleanInput = normalizeText(plaintextContent);

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (apiKey && cleanInput.length > 30) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
You are the senior ingestion engine for VerifiedCV (verifiedcv.app).
Extract the candidate's career track record losslessly into structured, atomic milestones.

STRICT INSTRUCTIONS:
1. Every distinct role, company, or multi-year era MUST be its own separate milestone object.
2. DO NOT combine different career eras or organizations into one entry.
3. 'company': Clean organization name.
4. 'role': Professional title.
5. 'period': Date range (e.g. "2010 — 2024" or "2024 — Present").
6. 'calibratedClaim': Paragraph summarizing accomplishments, platform scale, technical execution, and outcomes. Remove bullet characters.

RESUME TEXT:
"""
${cleanInput}
"""
`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [prompt],
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
      } catch (geminiErr) {
        console.warn("Gemini call failed, utilizing native anchor engine:", geminiErr);
      }
    }

    const fallbackResult = segmentResumeIntoChapters(cleanInput);

    return NextResponse.json({
      success: true,
      engine: "native-zlib-anchor-engine",
      fullName: fallbackResult.fullName,
      headline: fallbackResult.headline,
      milestones: fallbackResult.milestones
    });
  } catch (err: unknown) {
    console.error("Critical parse route error:", err);
    const message = err instanceof Error ? err.message : "Parse error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}