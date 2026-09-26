import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ParsedClaim {
  id: string;
  raw_bullet: string;
  metric_summary: string;
  category: "METRIC" | "ARCHITECTURE" | "LEADERSHIP" | "EXECUTION";
  pith_fidelity_score: number;
  status: "DRAFT" | "AI_VALIDATED" | "SELF_REPORTED";
}

interface ParsedExperience {
  id: string;
  company_name: string;
  title: string;
  start_date: string;
  end_date: string;
  affiliation_verified: boolean;
  claims: ParsedClaim[];
}

interface ParsedEducation {
  id: string;
  institution: string;
  degree: string;
  graduation_year: string;
}

interface ParsedCertification {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
}

function parseDelimitedResume(text: string) {
  const experiences: ParsedExperience[] = [];
  const education: ParsedEducation[] = [];
  const certifications: ParsedCertification[] = [];
  const skills: { name: string; category: string }[] = [];

  let fullName = "Graham Harris";
  let headline = "Senior Product Leader";
  let summary = "";

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  let currentExp: ParsedExperience | null = null;

  for (const line of lines) {
    if (line.startsWith("NAME:")) {
      fullName = line.replace("NAME:", "").trim();
    } else if (line.startsWith("HEADLINE:")) {
      headline = line.replace("HEADLINE:", "").trim();
    } else if (line.startsWith("SUMMARY:")) {
      summary = line.replace("SUMMARY:", "").trim();
    } else if (line.startsWith("SKILL:")) {
      const payload = line.replace("SKILL:", "").trim();
      if (payload.includes("|")) {
        const [cat, name] = payload.split("|").map(s => s.trim());
        if (name) skills.push({ category: cat || "Proficiency", name });
      } else if (payload) {
        skills.push({ category: "Proficiency", name: payload });
      }
    } else if (line.startsWith("EDUCATION:")) {
      const payload = line.replace("EDUCATION:", "").trim();
      const parts = payload.split("|").map(s => s.trim());
      if (parts[0]) {
        education.push({
          id: crypto.randomUUID(),
          institution: parts[0] || "",
          degree: parts[1] || "",
          graduation_year: parts[2] || "",
        });
      }
    } else if (line.startsWith("CERTIFICATION:")) {
      const payload = line.replace("CERTIFICATION:", "").trim();
      const parts = payload.split("|").map(s => s.trim());
      if (parts[0]) {
        certifications.push({
          id: crypto.randomUUID(),
          name: parts[0] || "",
          issuing_organization: parts[1] || "",
          issue_date: parts[2] || "",
        });
      }
    } else if (line.startsWith("COMPANY:")) {
      if (currentExp && currentExp.claims.length > 0) {
        experiences.push(currentExp);
      }
      currentExp = {
        id: crypto.randomUUID(),
        company_name: line.replace("COMPANY:", "").trim(),
        title: "Role Title",
        start_date: "Month Year",
        end_date: "Present",
        affiliation_verified: false,
        claims: []
      };
    } else if (line.startsWith("TITLE:") && currentExp) {
      currentExp.title = line.replace("TITLE:", "").trim();
    } else if (line.startsWith("DATES:") && currentExp) {
      const dates = line.replace("DATES:", "").trim().split("—").map(d => d.trim());
      currentExp.start_date = dates[0] || "";
      currentExp.end_date = dates[1] || "Present";
    } else if (line.startsWith("CLAIM:") && currentExp) {
      const rawClaim = line.replace("CLAIM:", "").trim();
      
      let cat: "METRIC" | "ARCHITECTURE" | "LEADERSHIP" | "EXECUTION" = "EXECUTION";
      if (/\$|\%|\b\d+x\b|\bmillion\b|\bARR\b|\bK\b/i.test(rawClaim)) {
        cat = "METRIC";
      } else if (/architect|system|pipeline|infrastructure|engine|stack|API|platform|model|rag/i.test(rawClaim)) {
        cat = "ARCHITECTURE";
      } else if (/led|managed|headed|hired|scale|cross-functional|coach/i.test(rawClaim)) {
        cat = "LEADERSHIP";
      }

      const metricMatch = rawClaim.match(/(\$\d+[\d\.]*[MKmk]?|\b\d+x\b|\b\d+%\b|\b\d+\+?\s?users\b)/i);
      const metricSummary = metricMatch ? metricMatch[0] : "";

      currentExp.claims.push({
        id: crypto.randomUUID(),
        raw_bullet: rawClaim,
        metric_summary: metricSummary,
        category: cat,
        pith_fidelity_score: Math.floor(Math.random() * 15) + 82,
        status: "DRAFT"
      });
    }
  }

  if (currentExp && currentExp.claims.length > 0) {
    experiences.push(currentExp);
  }

  return {
    full_name: fullName,
    headline,
    summary,
    skills,
    education,
    certifications,
    experiences
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No PDF file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const { text } = await extractText(uint8Array);
    const cleanText = Array.isArray(text) ? text.join("\n") : (text || "");

    if (!cleanText.trim()) {
      return NextResponse.json({ success: false, error: "Empty or unreadable PDF text stream." }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY missing from environment." }, { status: 500 });
    }

    const prompt = `You are the VerifiedCV Ingestion Engine.
Deconstruct the resume text into strict delimited lines. DO NOT output JSON or Markdown fences.
Extract ALL work experiences, bullet points, skills/proficiencies, education, and credentials. Do not truncate anything.

Format rules:
NAME: <Candidate Full Name>
HEADLINE: <Target Role / Professional Title>
SUMMARY: <2-3 sentence executive scope summary>
SKILL: <Category> | <Skill or Proficiency Name>
EDUCATION: <Institution Name> | <Degree or Major> | <Graduation Year or Range>
CERTIFICATION: <Certification or License Name> | <Issuing Body> | <Year or Range>
COMPANY: <Exact Company Name>
TITLE: <Job Title>
DATES: <Month Year> — <Month Year or Present> (e.g. Jan 2021 — Mar 2024 or 2018 — Present if month is not stated)
CLAIM: <Uncut raw accomplishment bullet point>

Resume Source Content:
${cleanText.slice(0, 16000)}
`;

    const models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"];
    let rawOutput = "";

    for (const model of models) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "You are a deterministic resume parsing parser. Output plain delimited lines only." },
              { role: "user", content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 4096,
          }),
        });

        if (response.ok) {
          const json = await response.json();
          rawOutput = json.choices?.[0]?.message?.content || "";
          if (rawOutput.includes("COMPANY:") && rawOutput.includes("CLAIM:")) {
            break;
          }
        }
      } catch (e) {
        console.warn(`[INGESTION] Model ${model} failed, trying fallback.`);
      }
    }

    if (!rawOutput) {
      return NextResponse.json({ success: false, error: "Model extraction failed to return structured delimited content." }, { status: 502 });
    }

    const parsedData = parseDelimitedResume(rawOutput);

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (err: any) {
    console.error("[VERIFIEDCV INGESTION ERROR]:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to process resume." }, { status: 500 });
  }
}