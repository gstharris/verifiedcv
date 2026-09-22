import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import OpenAI from "openai";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Active production multimodal model on Groq
const GROQ_VISION_MODEL = "qwen/qwen3.8-27b";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const experienceId = formData.get("experienceId") as string;
    const artifactType = (formData.get("artifactType") as string) || "EMPLOYEE_BADGE";
    const expectedCompany = (formData.get("expectedCompany") as string) || "";
    const expectedName = (formData.get("expectedName") as string) || "";

    if (!file || !experienceId) {
      return NextResponse.json(
        { error: "Missing required file or experience reference." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // 1. Calculate SHA-256 hash to prevent duplicate/reused uploads across accounts
    const sha256Hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // 2. Base64 encode for Vision analysis
    const base64Image = fileBuffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    const prompt = `You are a forensic document auditor for a candidate verification platform.
Analyze this artifact image (${artifactType}).

CONTEXT EXPECTED:
- Company / Organization: "${expectedCompany}"
- Individual Name: "${expectedName}"

TASKS:
1. Extract any visible text: Company name, individual name, job title, issue/expiry dates, department, or badge/license ID numbers.
2. Check for alignment: Does the extracted company name match or correlate with "${expectedCompany}"?
3. Detect sensitive private information that should be masked (e.g., full SSN, bank accounts, home address, exact salary).
4. Compute an authentic verification score bonus between 5 and 15:
   - Official badge with photo + company logo: +12 to +15
   - Business card with corporate email/title: +8 to +10
   - Conference badge / event pass: +5 to +7
   - Certificate / internal award: +10 to +14

Respond ONLY with valid JSON in this exact structure:
{
  "matchedCompany": boolean,
  "detectedCompany": string,
  "detectedName": string,
  "detectedTitle": string,
  "datesFound": string,
  "identifierSummary": string,
  "suggestedTrustDelta": number,
  "sensitiveItemsFound": string[],
  "auditSummary": string
}`;

    // 3. Vision Analysis with active production model
    const response = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const parsedAudit = JSON.parse(response.choices[0]?.message?.content || "{}");

    // Ensure trust delta stays strictly bounded between 5% and 15%
    const boundedDelta = Math.min(Math.max(parsedAudit.suggestedTrustDelta || 8, 5), 15);

    return NextResponse.json({
      success: true,
      sha256Hash,
      artifactType,
      audit: {
        ...parsedAudit,
        suggestedTrustDelta: boundedDelta,
      },
    });
  } catch (error: any) {
    console.error("Artifact verification failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process artifact." },
      { status: 500 }
    );
  }
}