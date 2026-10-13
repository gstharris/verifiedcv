import { NextRequest, NextResponse } from "next/server";
import { companySiteGuesses } from "@/lib/companySite";

export const dynamic = "force-dynamic";

async function reachable(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(2500),
      headers: { "User-Agent": "VerifiedCV company lookup" }
    });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

function preferLive(guesses: string[], live: string[]) {
  const ranked = live.length ? live : guesses.slice(0, 2);
  const seen = new Set<string>();
  const sites: string[] = [];
  for (const url of ranked) {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (seen.has(host)) continue;
    seen.add(host);
    const www = ranked.find((item) => new URL(item).hostname === `www.${host}`) || url;
    sites.push(www);
  }
  return sites.slice(0, 2);
}

export async function GET(req: NextRequest) {
  const name = String(req.nextUrl.searchParams.get("name") || "").trim();
  const guesses = companySiteGuesses(name);
  if (guesses.length === 0) return NextResponse.json({ sites: [] });
  const checks = await Promise.all(guesses.map(async (url) => ((await reachable(url)) ? url : "")));
  return NextResponse.json({ sites: preferLive(guesses, checks.filter(Boolean)) });
}
