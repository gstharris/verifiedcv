import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory persistent map for server runtime
const vaultStore = new Map<string, any>();

// Seed default Graham Harris canonical dossier
vaultStore.set("gharris", {
  handle: "gharris",
  email: "gstharris@gmail.com",
  fullName: "Graham Harris",
  headline: "Head of Product Management • AI Platforms",
  summaryStatement:
    "Built enterprise technology and ad personalization platforms from $0 to $400M with full P&L ownership, 3 patents, and an 18-person global team across 8 countries at Yahoo. Founded an operational workflow and recommendation platform at PairedRight, engineering RAG architectures evaluated against an operational golden dataset to scale client revenue by over $1M. Restructured complex multi-product SaaS portfolios into modular tiers at Bazaarvoice, reducing sales cycles by 25% and decreasing customer churn by 15%.",
  skills: [
    "AI Workspace Platforms",
    "Agentic Workflows",
    "Context-Grounded RAG",
    "Ad Personalization Systems",
    "High-Throughput Distributed Microservices",
    "Product Strategy & P&L",
    "Operational Golden Datasets",
    "Interactive Prototyping (React/Cursor)"
  ],
  education: [
    {
      id: "edu-gh-1",
      institution: "University of California",
      degree: "Bachelor of Science",
      year: "Graduated"
    }
  ],
  milestones: [
    {
      id: "m-gh-geon-01",
      company: "Ge-on",
      role: "Head of Product Management",
      period: "May 2025 — Present",
      claims: [
        "Direct end-to-end product strategy, feature prioritization, and delivery roadmaps for an AI workspace platform, driving a 25% lift in weekly active users during initial rollout.",
        "Designed and deployed autonomous agent workflows and proactive push notifications that feed a persistent memory layer, allowing the platform to learn creator preferences and maintain context across interactions.",
        "Build functional interactive prototypes in React, Cursor, and modern UI tools to test user workflows, edge cases, and interface ergonomics directly with users prior to engineering sprints.",
        "Designed and deployed self-serve onboarding journeys and workspace configuration flows, lifting new user activation and account setup completion by 20%.",
        "Partner daily with engineering, data science, and design in Agile cadences to manage backlogs, set acceptance criteria, and ensure system stability."
      ],
      isCorroborated: false
    },
    {
      id: "m-gh-scd-02",
      company: "SCD Enterprises / PairedRight",
      role: "Founder and Head of Product",
      period: "2018 — Mar 2026",
      claims: [
        "Founded an operational workflow and recommendation platform for hospitality operators, scaling client revenue by over $1M through automated upselling and real-time guidance.",
        "Rebuilt the core recommendation engine using a context-grounded RAG framework, ensuring automated pairing suggestions remained strictly constrained to curated merchant parameters.",
        "Established an operational golden dataset to benchmark, verify, and regression-test algorithmic changes, ensuring recommendation accuracy before deploying updates to frontline staff devices.",
        "Designed operator dashboards and administrative consoles, providing business owners visibility and control over recommendation rules, inventory availability, and pricing thresholds.",
        "Engineered API integration layers connecting customer-facing mobile interfaces directly with legacy point-of-sale and back-office systems of record to maintain data synchronization.",
        "Designed and deployed automated quote-to-cash workflows, multi-party fee reconciliation, and transactional audit trails, eliminating manual reporting and reducing operational overhead by 10%.",
        "Conducted hundreds of hours of on-site customer discovery shadowing managers and frontline operators during live shifts, converting ground-level friction into structured product specifications."
      ],
      isCorroborated: false
    },
    {
      id: "m-gh-yahoo-03",
      company: "Yahoo",
      role: "Head of Product Management",
      period: "2010 — 2024",
      claims: [
        "Built ad personalization and enterprise platforms from $0 to $400M with full P&L ownership, 3 patents, and an 18-person global team across 8 countries.",
        "Maintained sub-50ms query latency budgets across global edge infrastructure."
      ],
      isCorroborated: true
    }
  ]
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = (searchParams.get("handle") || "").toLowerCase().trim();

  if (!handle) {
    return NextResponse.json({ error: "Handle parameter required." }, { status: 400 });
  }

  const record = vaultStore.get(handle);
  if (!record) {
    return NextResponse.json({ error: "Handle not found in Vault." }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const handle = (payload.handle || "").toLowerCase().trim();

    if (!handle || !payload.fullName || !payload.email) {
      return NextResponse.json(
        { error: "Handle, full name, and email are required to commit to Vault." },
        { status: 400 }
      );
    }

    const dossierRecord = {
      ...payload,
      handle,
      updatedAt: new Date().toISOString()
    };

    vaultStore.set(handle, dossierRecord);

    return NextResponse.json({
      success: true,
      handle,
      dossierUrl: `https://verifiedcv.app/${handle}`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Vault commit error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}