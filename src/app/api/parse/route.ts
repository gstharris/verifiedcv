import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ExtractedMilestone {
  id: string;
  company: string;
  role: string;
  period: string;
  rawText: string;
  calibratedClaim: string;
  metrics: { label: string; value: string }[];
  tier: "tier_1_identity";
  isCorroborated: boolean;
}

function parseTextIntoMilestones(text: string): ExtractedMilestone[] {
  if (!text || text.trim().length === 0) return [];

  // Normalize line breaks
  const clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  const yearRangeRegex = /(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|present|current)/i;
  const singleYearRegex = /\b(19|20)\d{2}\b/;

  const milestones: ExtractedMilestone[] = [];
  let currentCompany = "";
  let currentRole = "";
  let currentPeriod = "";
  let currentBullets: string[] = [];

  const flush = () => {
    if (currentCompany || currentBullets.length > 0) {
      const claim = currentBullets.join(" ").trim() || "Executed core business and product objectives.";
      milestones.push({
        id: `m-parse-${Date.now()}-${milestones.length}`,
        company: currentCompany || "Career Chapter",
        role: currentRole || "Leader / Contributor",
        period: currentPeriod || "Verified Tenure",
        rawText: claim,
        calibratedClaim: claim,
        metrics: [{ label: "Status", value: "Awaiting Calibration" }],
        tier: "tier_1_identity",
        isCorroborated: false
      });
      currentCompany = "";
      currentRole = "";
      currentPeriod = "";
      currentBullets = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasDate = yearRangeRegex.test(line) || singleYearRegex.test(line);

    if (hasDate && (line.includes("|") || line.includes("—") || line.includes("-") || line.length < 100)) {
      flush();

      const dateMatch = line.match(yearRangeRegex) || line.match(singleYearRegex);
      currentPeriod = dateMatch ? dateMatch[0] : "Verified Tenure";

      const lineWithoutDate = line.replace(currentPeriod, "").replace(/[|•–—,-]/g, " ").trim();
      const parts = lineWithoutDate.split(/\s{2,}|\t/).filter(Boolean);

      if (parts.length >= 2) {
        currentCompany = parts[0].trim();
        currentRole = parts[1].trim();
      } else {
        currentCompany = lineWithoutDate || "Career Chapter";
        currentRole = "Key Leader";
      }
    } else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
      currentBullets.push(line.replace(/^[•\-\*]\s*/, "").trim());
    } else {
      if (currentBullets.length === 0 && line.length < 60 && !line.includes(".")) {
        if (!currentCompany) currentCompany = line;
        else if (!currentRole) currentRole = line;
      } else {
        currentBullets.push(line);
      }
    }
  }

  flush();

  // Fallback to paragraph splitting if no dates matched
  if (milestones.length === 0) {
    const paragraphs = clean.split(/\n\s*\n/).filter((p) => p.trim().length > 30);
    return paragraphs.map((p, idx) => ({
      id: `m-block-${Date.now()}-${idx}`,
      company: `Career Milestone ${idx + 1}`,
      role: "Key Contributor",
      period: "Tenure",
      rawText: p.trim(),
      calibratedClaim: p.trim(),
      metrics: [{ label: "Ingest", value: "Parsed Block" }],
      tier: "tier_1_identity",
      isCorroborated: false
    }));
  }

  return milestones;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = "";

    // 1. Text / Markdown / Plain files
    if (file.name.endsWith(".txt") || file.name.endsWith(".md") || file.type.includes("text")) {
      rawText = buffer.toString("utf-8");
    } else {
      // 2. Fallback text extraction for binary streams (extract printable UTF-8 chunks)
      rawText = buffer
        .toString("utf-8")
        .replace(/[^\x20-\x7E\n\t]/g, " ")
        .replace(/\s{3,}/g, "\n");
    }

    const milestones = parseTextIntoMilestones(rawText);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      milestonesCount: milestones.length,
      milestones: milestones,
      rawSample: rawText.slice(0, 500)
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parse error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}