export const BETA_COOKIE = "vcv_beta_access";

export function isBetaEnforced() {
  return Boolean(process.env.BETA_ACCESS_CODE);
}

export function betaAcceptsCode() {
  return Boolean(process.env.BETA_ACCESS_CODE);
}

export function isValidBetaCode(code: string) {
  const expected = process.env.BETA_ACCESS_CODE;
  return Boolean(expected) && code.trim() === expected;
}
