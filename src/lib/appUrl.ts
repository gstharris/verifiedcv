function stripSlash(value: string) {
  return value.replace(/\/$/, "");
}

function canonicalizeAppUrl(url: string) {
  if (url === "https://verifiedcv.app") return "https://www.verifiedcv.app";
  return url;
}

export function getAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const onVercelProduction = process.env.VERCEL_ENV === "production";

  if (explicit && !(onVercelProduction && /localhost|127\.0\.0\.1/.test(explicit))) {
    return canonicalizeAppUrl(explicit);
  }

  if (onVercelProduction) {
    return "https://www.verifiedcv.app";
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${stripSlash(vercel)}`;

  return "http://localhost:3000";
}
