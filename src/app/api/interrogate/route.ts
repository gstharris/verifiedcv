import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// TIER 1 CEILING: Self-reported AI validation can never exceed 70%.
// To hit 85%+, peer attestation is required. 100% requires manager attestation.
const TIER_1_AI_MAX_FIDELITY = 70;

export async function POST(req: NextRequest) {
  try {
    const { claimId, answer } = await req.json();

    if (!claimId) {
      return NextResponse.json({ error: "claimId is required" }, { status: 400 });
    }

    // 1. Fetch Claim and Linked Experience
    const { data: claim, error: claimErr } = await supabaseAdmin
      .from("claims")
      .select("*, experiences(company_name, title, start_date, end_date)")
      .eq("id", claimId)
      .single();

    if (claimErr || !claim) {
      return NextResponse.json({ error: "Record not found in Vault" }, { status: 404 });
    }

    const companyName = claim.experiences?.company_name || "Company";
    const userId = claim.user_id;
    const currentScore = claim.pith_fidelity_score || 45;

    // 2. Fetch Perpetual Memory Context
    const { data: existingMemory } = await supabaseAdmin
      .from("audit_context")
      .select("context_type, summary")
      .eq("user_id", userId)
      .eq("company_name", companyName)
      .limit(6);

    const memoryDigest =
      existingMemory && existingMemory.length > 0
        ? existingMemory.map((m) => `• [${m.context_type}]: ${m.summary}`).join("\n")
        : "None recorded yet.";

    // 3. Fetch Previous Turns
    const { data: previousTurns } = await supabaseAdmin
      .from("claim_audits")
      .select("interrogation_turn, question, answer")
      .eq("claim_id", claimId)
      .order("created_at", { ascending: true });

    const turnCount = (previousTurns?.length || 0) + 1;

    const conversationHistory =
      previousTurns && previousTurns.length > 0
        ? previousTurns
            .map(
              (t, idx) =>
                `Round ${idx + 1}:\nQuestion: ${t.question}\nCandidate Answer: ${
                  t.answer || "N/A"
                }`
            )
            .join("\n\n")
        : "First round initiated.";

    // 4. System Prompt with Strict Rigor & Anti-Hand-Waving
    const systemPrompt = `You are the Pith Validation Coach.
Your mission is to help candidates build defensible, rock-solid claims for hiring teams.
You are fair, collaborative, but RIGOROUS. Do not accept hand-waving or generic buzzwords.

EVALUATION RUBRIC:
- SPECIFIC & OPERATIONAL (Names exact tools, trigger logic, funnel steps, trade-offs, architecture):
  Award fidelity_delta between +8 and +15.
- VAGUE / HAND-WAVY ("improved workflows", "better communication", "notifications were key", "helped the team"):
  Award fidelity_delta between +2 and +5. Gently challenge them to go deeper into the exact mechanics.

RESOLUTION RULES:
- Turn count is currently: ${turnCount}.
- Maximum turns: 3.
- If the candidate gave a specific, highly defensible operational response OR Turn Count >= 3:
  Set "is_resolved": true, and summarize why the claim has reached the maximum Tier 1 AI self-validation threshold.
- Otherwise, set "is_resolved": false, and ask a surgical follow-up requesting exact mechanics.
- Output raw JSON only.`;

    const userPrompt = `
ROLE & COMPANY: ${claim.experiences?.title} at ${companyName}
ORIGINAL CLAIM: "${claim.raw_bullet}"
CORE METRIC: ${claim.metric_summary}

PERPETUAL MEMORY:
${memoryDigest}

PRIOR ROUNDS:
${conversationHistory}

LATEST CANDIDATE ANSWER:
${answer ? `"${answer}"` : "INITIATION - Ask your first probing question on how this metric or deliverable was achieved."}

CURRENT SCORE: ${currentScore}% (Tier 1 Max Ceiling: 70%)

Respond in strict JSON:
{
  "question": "Next surgical question pushing for real mechanics, OR closing validation summary if resolved",
  "is_resolved": boolean,
  "fidelity_delta": number (integer: 2-5 for vague, 8-15 for detailed),
  "critique": "1-sentence evaluation explaining the fidelity bump",
  "new_facts": [
    {
      "context_type": "SCALE_BASELINE | TECH_STACK | TEAM_TOPOLOGY | ORGANIZATIONAL_CONSTRAINT",
      "summary": "Specific fact learned if candidate provided real detail"
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 450,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

    // Enforce bounds: delta between 2 and 15
    const rawDelta = typeof result.fidelity_delta === "number" ? result.fidelity_delta : 5;
    const cleanDelta = Math.max(2, Math.min(15, Math.round(rawDelta)));

    // Calculate score with hard Tier 1 ceiling (70%)
    const potentialScore = currentScore + cleanDelta;
    const finalScore = Math.min(TIER_1_AI_MAX_FIDELITY, potentialScore);
    const actualDeltaApplied = finalScore - currentScore;

    // 5. Store the Audit Turn
    await supabaseAdmin.from("claim_audits").insert({
      claim_id: claimId,
      user_id: userId,
      interrogation_turn: turnCount,
      question: result.question || "Could you provide more specific operational detail?",
      answer: answer || null,
      forensic_notes: result.critique || null,
      fidelity_delta: actualDeltaApplied,
    });

    // 6. Persist newly identified facts to Perpetual Memory
    if (result.new_facts && Array.isArray(result.new_facts) && result.new_facts.length > 0) {
      const factsToInsert = result.new_facts.map((fact: any) => ({
        user_id: userId,
        company_name: companyName,
        context_type: fact.context_type || "SCALE_BASELINE",
        summary: fact.summary,
      }));

      await supabaseAdmin.from("audit_context").insert(factsToInsert);
    }

    // 7. Update claim status and fidelity score in Supabase
    const isNowResolved = Boolean(result.is_resolved || turnCount >= 3);
    await supabaseAdmin
      .from("claims")
      .update({
        status: isNowResolved ? "VERIFIED_AI" : "IN_AUDIT",
        pith_fidelity_score: finalScore,
      })
      .eq("id", claimId);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        fidelity_delta: actualDeltaApplied,
        is_resolved: isNowResolved,
      },
      currentScore: finalScore,
      tierCeiling: TIER_1_AI_MAX_FIDELITY,
    });
  } catch (error: any) {
    console.error("Validation engine failed:", error);
    return NextResponse.json(
      { error: error.message || "Validation failed" },
      { status: 500 }
    );
  }
}