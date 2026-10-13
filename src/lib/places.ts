import { countryOptions, formatLocation, parseLocation } from "./locations";

type Place = {
  city: string;
  countryCode: string;
  region?: string;
  regionCode?: string;
  primary?: boolean;
};

const US: Array<[string, string, 1?]> = [
  ["New York", "NY", 1],
  ["Los Angeles", "CA", 1],
  ["Chicago", "IL", 1],
  ["Houston", "TX"],
  ["Phoenix", "AZ"],
  ["Philadelphia", "PA"],
  ["San Antonio", "TX"],
  ["San Diego", "CA"],
  ["Dallas", "TX"],
  ["San Jose", "CA"],
  ["Austin", "TX", 1],
  ["Jacksonville", "FL"],
  ["Fort Worth", "TX"],
  ["Columbus", "OH"],
  ["Charlotte", "NC"],
  ["Indianapolis", "IN"],
  ["San Francisco", "CA", 1],
  ["Seattle", "WA", 1],
  ["Denver", "CO", 1],
  ["Washington", "DC", 1],
  ["Boston", "MA", 1],
  ["Nashville", "TN"],
  ["Detroit", "MI"],
  ["Portland", "OR", 1],
  ["Portland", "ME"],
  ["Las Vegas", "NV"],
  ["Miami", "FL", 1],
  ["Atlanta", "GA", 1],
  ["Minneapolis", "MN"],
  ["Tampa", "FL"],
  ["Raleigh", "NC"],
  ["New Orleans", "LA"],
  ["Salt Lake City", "UT"],
  ["Kansas City", "MO"],
  ["Pittsburgh", "PA"],
  ["Cincinnati", "OH"],
  ["St. Louis", "MO"],
  ["Orlando", "FL"],
  ["Cleveland", "OH"],
  ["Honolulu", "HI"],
  ["Anchorage", "AK"],
  ["Paris", "TX"],
  ["Birmingham", "AL"],
  ["Cambridge", "MA"]
];

const WORLD: Array<[string, string, 1?]> = [
  ["London", "GB", 1],
  ["Manchester", "GB"],
  ["Edinburgh", "GB"],
  ["Birmingham", "GB", 1],
  ["Paris", "FR", 1],
  ["Lyon", "FR"],
  ["Marseille", "FR"],
  ["Berlin", "DE"],
  ["Munich", "DE"],
  ["Hamburg", "DE"],
  ["Frankfurt", "DE"],
  ["Cologne", "DE"],
  ["Madrid", "ES"],
  ["Barcelona", "ES"],
  ["Valencia", "ES"],
  ["Lisbon", "PT"],
  ["Porto", "PT"],
  ["Rome", "IT"],
  ["Milan", "IT"],
  ["Turin", "IT"],
  ["Florence", "IT"],
  ["Amsterdam", "NL"],
  ["Rotterdam", "NL"],
  ["Brussels", "BE"],
  ["Zurich", "CH"],
  ["Geneva", "CH"],
  ["Vienna", "AT"],
  ["Prague", "CZ"],
  ["Warsaw", "PL"],
  ["Krakow", "PL"],
  ["Budapest", "HU"],
  ["Dublin", "IE", 1],
  ["Copenhagen", "DK"],
  ["Stockholm", "SE"],
  ["Oslo", "NO"],
  ["Helsinki", "FI"],
  ["Reykjavik", "IS"],
  ["Athens", "GR"],
  ["Istanbul", "TR"],
  ["Moscow", "RU"],
  ["Kyiv", "UA"],
  ["Tel Aviv", "IL"],
  ["Jerusalem", "IL"],
  ["Dubai", "AE"],
  ["Abu Dhabi", "AE"],
  ["Doha", "QA"],
  ["Riyadh", "SA"],
  ["Cairo", "EG"],
  ["Casablanca", "MA"],
  ["Lagos", "NG"],
  ["Accra", "GH"],
  ["Nairobi", "KE", 1],
  ["Johannesburg", "ZA"],
  ["Cape Town", "ZA"],
  ["Mumbai", "IN"],
  ["Delhi", "IN"],
  ["Bengaluru", "IN"],
  ["Hyderabad", "IN"],
  ["Chennai", "IN"],
  ["Pune", "IN"],
  ["Kolkata", "IN"],
  ["Karachi", "PK"],
  ["Lahore", "PK"],
  ["Dhaka", "BD"],
  ["Colombo", "LK"],
  ["Kathmandu", "NP"],
  ["Singapore", "SG", 1],
  ["Kuala Lumpur", "MY"],
  ["Jakarta", "ID"],
  ["Bangkok", "TH"],
  ["Ho Chi Minh City", "VN"],
  ["Hanoi", "VN"],
  ["Manila", "PH"],
  ["Hong Kong", "HK", 1],
  ["Taipei", "TW"],
  ["Tokyo", "JP", 1],
  ["Osaka", "JP"],
  ["Seoul", "KR"],
  ["Beijing", "CN"],
  ["Shanghai", "CN"],
  ["Shenzhen", "CN"],
  ["Sydney", "AU", 1],
  ["Melbourne", "AU"],
  ["Brisbane", "AU"],
  ["Auckland", "NZ"],
  ["Wellington", "NZ"],
  ["Toronto", "CA", 1],
  ["Vancouver", "CA"],
  ["Montreal", "CA"],
  ["Ottawa", "CA"],
  ["Calgary", "CA"],
  ["Mexico City", "MX"],
  ["Guadalajara", "MX"],
  ["Sao Paulo", "BR"],
  ["Rio de Janeiro", "BR"],
  ["Buenos Aires", "AR"],
  ["Santiago", "CL"],
  ["Bogota", "CO"],
  ["Lima", "PE"],
  ["Cambridge", "GB", 1]
];

const US_STATE_CODES = new Set(US.map(([, regionCode]) => regionCode.toLowerCase()));

const PLACES: Place[] = [
  ...US.map(([city, regionCode, primary]) => ({
    city,
    countryCode: "US",
    regionCode,
    primary: primary === 1
  })),
  ...WORLD.map(([city, countryCode, primary]) => ({
    city,
    countryCode,
    primary: primary === 1
  }))
];

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const countryName = (code: string) =>
  countryOptions().find((country) => country.code === code)?.name || code;

export type PlaceSuggestion = {
  city: string;
  countryCode: string;
  label: string;
  detail: string;
};

function suggestion(place: Place): PlaceSuggestion {
  return {
    city: place.city,
    countryCode: place.countryCode,
    label: formatLocation(place.city, place.countryCode),
    detail: place.regionCode ? `${place.regionCode} · ${countryName(place.countryCode)}` : countryName(place.countryCode)
  };
}

export function suggestPlaces(query: string, limit = 6): PlaceSuggestion[] {
  const trimmed = String(query || "").trim();
  const folded = fold(trimmed);
  if (!folded) return [];
  const comma = trimmed.lastIndexOf(",");
  const cityQuery = fold(comma > 0 ? trimmed.slice(0, comma) : trimmed);
  const regionQuery = comma > 0 ? fold(trimmed.slice(comma + 1)) : "";
  const remoteHit = !regionQuery && cityQuery.length >= 2 && "remote".startsWith(cityQuery);
  const ranked = PLACES.map((place) => {
    const city = fold(place.city);
    let score = 0;
    if (city === cityQuery) score = 100;
    else if (city.startsWith(cityQuery)) score = 70;
    else if (cityQuery.length >= 3 && city.includes(cityQuery)) score = 40;
    if (!score) return null;
    if (place.primary) score += 8;
    if (regionQuery) {
      const region = fold(place.regionCode || "");
      const country = fold(countryName(place.countryCode));
      if (region === regionQuery || country === regionQuery || region.startsWith(regionQuery) || country.startsWith(regionQuery)) {
        score += 40;
      } else {
        score -= 35;
      }
    }
    return { place, score };
  })
    .filter((item): item is { place: Place; score: number } => Boolean(item && item.score > 0))
    .sort((a, b) => b.score - a.score || a.place.city.localeCompare(b.place.city));

  const seen = new Set<string>();
  const results: PlaceSuggestion[] = [];
  if (remoteHit) results.push({ city: "", countryCode: "", label: "Remote", detail: "No city" });
  for (const item of ranked) {
    const key = `${item.place.city}|${item.place.countryCode}|${item.place.regionCode || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(suggestion(item.place));
    if (results.length >= limit) break;
  }
  return results;
}

export function resolvePlace(query: string): PlaceSuggestion | null {
  const trimmed = String(query || "").trim();
  if (!trimmed) return null;
  if (/^remote$/i.test(trimmed)) return { city: "", countryCode: "", label: "Remote", detail: "No city" };

  const comma = trimmed.lastIndexOf(",");
  const regionToken = comma > 0 ? fold(trimmed.slice(comma + 1)) : "";
  const looksLikeUsState = regionToken.length === 2 && US_STATE_CODES.has(regionToken);
  if (!looksLikeUsState) {
    const parsed = parseLocation(trimmed);
    if (parsed && parsed.label !== "Remote") {
      return { city: parsed.city, countryCode: parsed.countryCode, label: parsed.label, detail: parsed.label };
    }
  }

  const matches = suggestPlaces(trimmed, 4).filter((place) => place.label !== "Remote");
  if (!matches.length) return null;
  const bareCity = comma < 0 && fold(matches[0].city) === fold(trimmed);
  if (bareCity || matches.length === 1 || comma > 0) return matches[0];
  return null;
}

type GeocodeHit = {
  name?: string;
  country_code?: string;
  admin1?: string;
  feature_code?: string;
  population?: number;
};

export function suggestionsFromGeocode(results: unknown, limit = 6): PlaceSuggestion[] {
  if (!Array.isArray(results)) return [];
  const ranked = results
    .map((item) => item as GeocodeHit)
    .filter((item) => {
      const name = String(item.name || "").trim();
      const code = String(item.feature_code || "");
      if (!name || !item.country_code) return false;
      if (code && !code.startsWith("PPL")) return false;
      return true;
    })
    .sort((a, b) => (b.population || 0) - (a.population || 0));

  const seen = new Set<string>();
  const suggestions: PlaceSuggestion[] = [];
  for (const item of ranked) {
    const countryCode = String(item.country_code || "").toUpperCase();
    const city = String(item.name || "").trim();
    const region = String(item.admin1 || "").trim();
    const country = countryName(countryCode);
    const label = region && region.toLowerCase() !== city.toLowerCase()
      ? `${city}, ${region}, ${country}`
      : formatLocation(city, countryCode);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    suggestions.push({
      city,
      countryCode,
      label,
      detail: region && region.toLowerCase() !== city.toLowerCase() ? `${region} · ${country}` : country
    });
    if (suggestions.length >= limit) break;
  }
  return suggestions;
}

export function mergePlaceSuggestions(local: PlaceSuggestion[], remote: PlaceSuggestion[], limit = 6) {
  const seen = new Set<string>();
  const merged: PlaceSuggestion[] = [];
  for (const place of [...local, ...remote]) {
    const key = place.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(place);
    if (merged.length >= limit) break;
  }
  return merged;
}
