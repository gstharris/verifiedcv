import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const docType = (formData.get("documentType") as string) || "PAYSTUB";
    const expectedEntity = (formData.get("expectedEntity") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No document provided for analysis." }, { status: 400 });
    }

    // Convert file to base64 for LLM Vision OCR processing
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const mimeType = file.type || "image/png";

    // Vision prompt instructing the model to act as a forensic privacy-preserving OCR agent
    const prompt = `You are a privacy-first OCR auditor for verified career credentials.
Examine this ${docType} document. 

TASK:
1. Extract the primary non-sensitive verifiers:
   - Entity / Organization / Company Name
   - Individual Name
   - Relevant Dates (Issue date, start date, pay period, expiration date)
   - Title, Role, License Number, or Certification Identifier
2. Identify and flag SENSITIVE information that MUST remain redacted or omitted:
   - Social Security Numbers (SSN), National IDs
   - Banking information (routing, account numbers)
   - Exact gross/net salary or pay rates (candidates only need to prove employment, not compensation)
   - Exact home street address
3. Confirm if this document corroborates employment or licensing with: "${expectedEntity}".

Respond ONLY with valid JSON in this exact structure:
{
  "isValid": true,
  "confidenceScore": 92,
  "extractedEntity": "Company or Issuing Authority Name",
  "extractedTitle": "Role Title or Certification Name",
  "datesFound": "e.g. June 2021 - Present",
  "identifierOrLicense": "e.g. DRE #01928374 or Employee ID (redacted except last 4)",
  "redactedItemsDetected": ["Social Security Number", "Bank Account Number", "Net Pay Amount"],
  "summary": "Verified official pay statement confirming employment during specified date range with private financial data redacted."
}`;

    // Process through LLM OCR
    const response = await groq.chat.completions.create({
      model: "llama-3.2-11b-vision-preview",
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

    const parsedData = JSON.parse(response.choices[0]?.message?.content || "{}");

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Document OCR Error:", error);
    return NextResponse.json({ error: error.message || "Document analysis failed." }, { status: 500 });
  }
}