import { NextRequest, NextResponse } from "next/server";
import { mergePlaceSuggestions, suggestionsFromGeocode, suggestPlaces } from "@/lib/places";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = String(req.nextUrl.searchParams.get("q") || "").trim();
  const local = suggestPlaces(query);
  if (query.length < 2) {
    return NextResponse.json({ places: local });
  }

  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query);
    url.searchParams.set("count", "8");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    const response = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "VerifiedCV city lookup" }
    });
    if (!response.ok) return NextResponse.json({ places: local });
    const data = await response.json();
    return NextResponse.json({
      places: mergePlaceSuggestions(local, suggestionsFromGeocode(data.results))
    });
  } catch {
    return NextResponse.json({ places: local });
  }
}
