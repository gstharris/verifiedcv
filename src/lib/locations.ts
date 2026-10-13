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

export function parseLocation(value: string): { city: string; countryCode: string; label: string } | null {
  const trimmed = String(value || "").replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  if (/^remote$/i.test(trimmed)) return { city: "", countryCode: "", label: "Remote" };

  const comma = trimmed.lastIndexOf(",");
  if (comma <= 0) return null;
  const city = trimmed.slice(0, comma).trim();
  const countryText = trimmed.slice(comma + 1).trim();
  const country =
    countryOptions().find((option) => option.code.toLowerCase() === countryText.toLowerCase()) ||
    byName().get(countryText.toLowerCase());
  if (!country || !/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,80}$/u.test(city)) return null;
  return { city, countryCode: country.code, label: `${city}, ${country.name}` };
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
