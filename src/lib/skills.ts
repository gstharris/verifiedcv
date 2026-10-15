export function splitSkillText(text: string) {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of text) {
    if (char === "(") depth += 1;
    else if (char === ")" && depth > 0) depth -= 1;
    else if (depth === 0 && /[,|•●;\/]/.test(char)) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current) parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

export function repairSkillList(skills: unknown) {
  const source = Array.isArray(skills) ? skills : [];
  const joined: string[] = [];
  let open = 0;
  for (const item of source) {
    const skill = String(item || "").trim();
    if (!skill) continue;
    const opens = (skill.match(/\(/g) || []).length;
    const closes = (skill.match(/\)/g) || []).length;
    if (joined.length && (open > 0 || (closes > opens && /^[^()]+\)$/.test(skill)))) {
      const previous = joined[joined.length - 1];
      joined[joined.length - 1] =
        open > 0 ? `${previous}, ${skill}` : `${previous} (${skill}`;
    } else {
      joined.push(skill);
    }
    open += opens - closes;
    if (open < 0) open = 0;
  }
  return joined;
}
