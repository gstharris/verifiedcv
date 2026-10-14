const COUNTRY_CODES = [
  "AF","AL","DZ","AR","AM","AU","AT","AZ","BH","BD","BY","BE","BZ","BJ","BT","BO","BA","BW","BR","BN",
  "BG","BF","BI","KH","CM","CA","CV","CF","TD","CL","CN","CO","KM","CG","CR","CI","HR","CU","CY","CZ",
  "DK","DJ","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FJ","FI","FR","GA","GM","GE","DE","GH","GR",
  "GT","GN","GY","HT","HN","HK","HU","IS","IN","ID","IR","IQ","IE","IL","IT","JM","JP","JO","KZ","KE",
  "KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MG","MW","MY","MV","ML","MT","MR","MU",
  "MX","MD","MC","MN","ME","MA","MZ","MM","NA","NP","NL","NZ","NI","NE","NG","KP","MK","NO","OM","PK",
  "PA","PG","PY","PE","PH","PL","PT","QA","RO","RU","RW","SA","SN","RS","SG","SK","SI","SO","ZA","KR",
  "SS","ES","LK","SD","SR","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TO","TT","TN","TR","TM","UG",
  "UA","AE","GB","US","UY","UZ","VE","VN","YE","ZM","ZW"
] as const;

export type CountryOption = {
  code: string;
  name: string;
  flag: string;
};

export function flagEmoji(countryCode: string) {
  const code = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return [...code].map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join("");
}

export function countryOptions(): CountryOption[] {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  return COUNTRY_CODES.map((code) => ({
    code,
    name: names.of(code) || code,
    flag: flagEmoji(code)
  })).sort((a, b) => a.name.localeCompare(b.name));
}

const byName = () => {
  const map = new Map<string, CountryOption>();
  for (const country of countryOptions()) map.set(country.name.toLowerCase(), country);
  return map;
};

const US_STATE_NAMES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO",
  connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR",
  pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY", "district of columbia": "DC"
};

const US_STATE_CODES = new Set(Object.values(US_STATE_NAMES));

export function usStateAbbreviation(region: string) {
  const trimmed = region.replace(/\s+/g, " ").trim();
  if (/^[A-Za-z]{2}$/.test(trimmed) && US_STATE_CODES.has(trimmed.toUpperCase())) return trimmed.toUpperCase();
  return US_STATE_NAMES[trimmed.toLowerCase()] || "";
}

export function placeLabel(city: string, countryCode: string, region = "") {
  const place = city.replace(/\s+/g, " ").trim();
  if (!place) return "";
  if (countryCode.toUpperCase() === "US") {
    const abbreviation = usStateAbbreviation(region);
    if (abbreviation) return `${place}, ${abbreviation}`;
  }
  return formatLocation(place, countryCode);
}

export function parseLocation(value: string): { city: string; countryCode: string; label: string } | null {
  const trimmed = String(value || "").replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  if (/^remote$/i.test(trimmed)) return { city: "", countryCode: "", label: "Remote" };

  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return null;
  const city = parts[0];
  const placeName = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,80}$/u;
  if (!placeName.test(city)) return null;

  if (parts.length === 2 && parts[1].length === 2) {
    const abbreviation = usStateAbbreviation(parts[1]);
    if (abbreviation) return { city, countryCode: "US", label: `${city}, ${abbreviation}` };
  }

  const countryText = parts[parts.length - 1];
  const region = parts.length === 3 ? parts[1] : "";
  const country =
    countryOptions().find((option) => option.code.toLowerCase() === countryText.toLowerCase()) ||
    byName().get(countryText.toLowerCase());
  if (region && !placeName.test(region)) return null;
  if (country) {
    return { city, countryCode: country.code, label: placeLabel(city, country.code, region) };
  }

  const abbreviation = usStateAbbreviation(parts[1] || "");
  if (parts.length === 2 && abbreviation) return { city, countryCode: "US", label: `${city}, ${abbreviation}` };
  return null;
}

export function formatLocation(city: string, countryCode: string) {
  const country = countryOptions().find((option) => option.code === countryCode.toUpperCase());
  const place = city.replace(/\s+/g, " ").trim();
  if (!country || !place) return "";
  return `${place}, ${country.name}`;
}

export function locationError(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed || /^remote$/i.test(trimmed)) return "";
  if (parseLocation(trimmed)) return "";
  return "Choose a city and a country, or Remote.";
}
