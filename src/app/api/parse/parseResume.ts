import { splitSkillText } from "@/lib/skills";

export interface ExtractedMilestone {
  id: string;
  company: string;
  role: string;
  period: string;
  location?: string;
  claims: string[];
  calibratedClaim: string;
  isCorroborated: boolean;
}

export interface ExtractedEducation {
  id: string;
  institution: string;
  degree: string;
  year?: string;
}

export interface CandidateContactInfo {
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  linkedinVerified: boolean;
}

export interface ParsedDossierPayload {
  fullName: string;
  headline: string;
  summaryStatement: string;
  contact: CandidateContactInfo;
  skills: string[];
  education: ExtractedEducation[];
  milestones: ExtractedMilestone[];
  highlights: string[];
}

function cleanBodySentence(text: string): string {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/^(?:[●•\*–—◦‣⁃·]+\s*|\-\s+)+/, "")
    .replace(/^\d{1,2}[.)]\s+/, "")
    .replace(/[●•\*–—◦‣⁃·]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanEntityHeader(text: string): string {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/^[●•\-\*–—◦‣⁃·\s]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isHighlightHeader(line: string) {
  const compact = line.replace(/[:|–—-]/g, " ").replace(/\s+/g, " ").trim();
  if (!compact || compact.length > 40) return false;
  if (/^[●•\-*]/.test(line.trim())) return false;
  return /^(?:career |selected |key |professional )?highlights$/i.test(compact);
}

function isValidAchievement(text: string): boolean {
  const lettersOnly = text.replace(/[^a-zA-Z]/g, "");
  return lettersOnly.length >= 12;
}

export function normalizeTenurePeriod(raw: string): string {
  const cleaned = raw.replace(/[|()]/g, " ").replace(/\s{2,}/g, " ").trim();

  const rangePattern = /(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s*)?(\b(?:19|20)\d{2}\b)\s*(?:—|-|–|to|\/)\s*(?:(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s*)?(\b(?:19|20)\d{2}\b)|(Present|Current|Now))/i;

  const match = cleaned.match(rangePattern);
  if (match) {
    const startMonth = match[1] ? match[1].trim() : "";
    const startYear = match[2];
    const endMonth = match[3] ? match[3].trim() : "";
    const endYear = match[4];
    const isPresent = Boolean(match[5]);

    const startPart = startMonth ? `${startMonth} ${startYear}` : startYear;
    let endPart = "Present";

    if (!isPresent && endYear) {
      endPart = endMonth ? `${endMonth} ${endYear}` : endYear;
    }

    return `${startPart} — ${endPart}`;
  }

  const presentOnlyPattern = /(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s*)?(\b(?:19|20)\d{2}\b)\s*(?:to|-|—|–)?\s*(Present|Current)/i;
  const pMatch = cleaned.match(presentOnlyPattern);
  if (pMatch) {
    const m = pMatch[1] ? pMatch[1].trim() + " " : "";
    return `${m}${pMatch[2]} — Present`;
  }

  return raw.trim() || "Confirmed Tenure";
}

export function extractAtomicAchievements(rawLines: string[]): string[] {
  const contentLines = rawLines
    .map((l) => l.trim())
    .filter((l) => Boolean(l));

  if (contentLines.length === 0) return [];

  const achievements: string[] = [];
  let currentBuffer = "";

  const actionVerbStart = /^(Direct|Directed|Design|Designed|Build|Built|Deploy|Deployed|Partner|Partnered|Found|Founded|Rebuild|Rebuilt|Establish|Established|Engineer|Engineered|Conduct|Conducted|Scale|Scaled|Lead|Led|Restructure|Restructured|Architect|Architected|Manage|Managed|Create|Created|Drive|Drove|Deliver|Delivered|Author|Authored|Spearhead|Spearheaded|Oversee|Oversaw|Execute|Executed|Implement|Implemented|Grow|Grew|Launch|Launched)\b/i;

  for (let i = 0; i < contentLines.length; i++) {
    const raw = contentLines[i];
    const startsWithBullet = /^[●•\-\*–—◦‣⁃·]/.test(raw);
    const cleanText = cleanBodySentence(raw);

    if (!cleanText || cleanText.replace(/[^a-zA-Z]/g, "").length < 3) continue;

    const continuesWrappedLine = Boolean(currentBuffer) && /^[a-z0-9]/.test(cleanText);
    if (continuesWrappedLine) {
      currentBuffer += " " + cleanText;
      continue;
    }

    const prevEndedWithPeriod = currentBuffer.endsWith(".") || currentBuffer.endsWith(";");
    const isNewActionSentence = prevEndedWithPeriod && actionVerbStart.test(cleanText);
    const isCapitalizedNewSentence = prevEndedWithPeriod && /^[A-Z]/.test(cleanText) && cleanText.length > 20;

    if (startsWithBullet || isNewActionSentence || isCapitalizedNewSentence) {
      if (currentBuffer && isValidAchievement(currentBuffer)) {
        achievements.push(currentBuffer);
      }
      currentBuffer = cleanText;
    } else {
      if (!currentBuffer) {
        currentBuffer = cleanText;
      } else {
        currentBuffer += " " + cleanText;
      }
    }
  }

  if (currentBuffer && isValidAchievement(currentBuffer)) {
    achievements.push(currentBuffer);
  }

  return achievements.filter(isValidAchievement);
}

export function isEducationItem(text: string): boolean {
  return (
    /\b(university|college|bachelor|master|degree|polytechnic|institute of technology|graduated)\b/i.test(
      text
    ) || /\b(?:b\.s\.|b\.a\.|m\.s\.|m\.b\.a\.|ph\.d\.)/i.test(text)
  );
}

const SECTION_HEADERS: { section: "SUMMARY" | "EXPERIENCE" | "SKILLS" | "EDUCATION"; pattern: RegExp }[] = [
  { section: "SUMMARY", pattern: /^(?:professional summary|executive summary|summary|profile|about me)\b/i },
  { section: "EXPERIENCE", pattern: /^(?:professional experience|work experience|employment history|employment|career history|work history|professional history|experience)\b/i },
  { section: "SKILLS", pattern: /^(?:technical skills|core competencies|core proficiencies|core skills|key skills|skills|technologies|areas of expertise|proficiencies)\b/i },
  { section: "EDUCATION", pattern: /^(?:education(?:\s+(?:and|&)\s+certifications)?|academic background|degrees & certifications|education & credentials)\b/i }
];

function sectionFromLine(line: string): { section: "SUMMARY" | "HIGHLIGHTS" | "EXPERIENCE" | "SKILLS" | "EDUCATION"; rest: string } | null {
  if (isBulletLine(line)) return null;
  if (isHighlightHeader(line)) return { section: "HIGHLIGHTS", rest: "" };
  const trimmed = line.trim();
  for (const header of SECTION_HEADERS) {
    const match = trimmed.match(header.pattern);
    if (!match) continue;
    return { section: header.section, rest: trimmed.slice(match[0].length).replace(/^[:|\-–—\s]+/, "").trim() };
  }
  return null;
}

function tenureSpan(line: string) {
  return line.match(
    /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+)?(?:19|20)\d{2}\s*(?:—|-|–|to|\/)\s*(?:(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+)?(?:19|20)\d{2}|Present|Current|Now)/i
  );
}

function isBulletLine(line: string) {
  return /^[●•\-*–—◦‣⁃·]/.test(line.trim());
}

function looksLikeTitle(line: string) {
  const trimmed = line.trim();
  return trimmed.length > 1 && trimmed.length <= 80 && !/[.!?]$/.test(trimmed) && !isBulletLine(trimmed);
}

function joinWrappedState(lines: string[]) {
  const joined: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    if (next && /,\s*$/.test(line) && /^[A-Z]{2}$/.test(next)) {
      joined.push(`${line.replace(/,\s*$/, ",")} ${next}`);
      i += 1;
      continue;
    }
    joined.push(line);
  }
  return joined;
}

function looksLikeDegree(text: string) {
  return /(?:^|\b)(?:b\.s\.|b\.a\.|m\.s\.|m\.b\.a\.|ph\.d\.)(?!\w)|\b(?:bachelor|master|certified|certification|certificate)\b/i.test(text);
}

function looksLikeSchool(text: string) {
  return /\b(?:university|college|institute|academy|alliance)\b/i.test(text);
}

function educationFields(parts: string[]) {
  const left = parts[0] || "";
  const right = parts[1] || "";
  if (looksLikeDegree(left) && !looksLikeSchool(left) && (looksLikeSchool(right) || !looksLikeDegree(right))) {
    return { institution: right || "Institution", degree: left || "Degree" };
  }
  return { institution: left || "Institution", degree: right || "Degree" };
}

function isSectionLabel(line: string) {
  const cleaned = line.replace(/^[●•\*–—◦‣⁃·]+\s*/, "").trim();
  if (tenureSpan(cleaned) || !/[A-Za-z]/.test(cleaned)) return false;
  return cleaned.length > 3 && cleaned.length < 48 && !cleaned.includes("|") && /^[A-Z0-9 &/,.-]+$/.test(cleaned);
}

function pipeChapterWithoutYear(line: string) {
  if (!line.includes("|") || tenureSpan(line)) return null;
  const parts = line.replace(/^[●•\*–—◦‣⁃·]+\s*/, "").split("|").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  return { company: parts[0], role: parts[1], claim: parts.slice(2).join(" | ") };
}

function isTenureOnly(line: string) {
  const span = tenureSpan(line);
  if (!span || isBulletLine(line)) return false;
  return line.replace(span[0], "").replace(/[^A-Za-z]/g, "").length < 4;
}

export const WORD_RESUME_MESSAGE = "Word files aren't read yet. Paste the resume text, or upload a PDF.";
export const EMPTY_PDF_MESSAGE = "This PDF has no selectable text. Paste the resume instead.";
export const THIN_RESUME_MESSAGE = "We couldn't read career chapters from that. Paste the resume text, or start from scratch.";

export function isWordResumeFile(name: string, type = "") {
  const lower = name.toLowerCase();
  return lower.endsWith(".docx") || lower.endsWith(".doc") || /wordprocessingml|msword/i.test(type);
}

function filledList(value: unknown) {
  return Array.isArray(value) && value.some((item) => String(item || "").trim());
}

export function resumeImportHasContent(data: Partial<ParsedDossierPayload>) {
  if (Array.isArray(data.milestones) && data.milestones.length > 0) return true;
  const named = Boolean(String(data.fullName || "").trim());
  const supporting = Boolean(
    String(data.summaryStatement || "").trim() ||
      filledList(data.highlights) ||
      filledList(data.skills) ||
      (Array.isArray(data.education) && data.education.length > 0)
  );
  return named && supporting;
}

function headerBesideTenure(line: string): { company: string; role: string; period: string } | null {
  if (line.includes("|") || isBulletLine(line) || isTenureOnly(line)) return null;
  const span = tenureSpan(line);
  if (!span || span.index === undefined) return null;
  const head = line.slice(0, span.index).trim().replace(/[|•,–—-]\s*$/, "").trim();
  if (!head) return null;
  const splitHead = head.split(/\s+[—–|]\s+|\s{2,}/).map(cleanEntityHeader).filter(Boolean);
  const parts = splitHead.length >= 2 ? splitHead : head.split(/\s+-\s+/).map(cleanEntityHeader).filter(Boolean);
  if (!parts.length) return null;
  return {
    company: parts[0],
    role: parts.slice(1).join(" ") || "Role",
    period: normalizeTenurePeriod(span[0])
  };
}

function extractContact(lines: string[]): CandidateContactInfo {
  const contact: CandidateContactInfo = {
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    emailVerified: false,
    phoneVerified: false,
    linkedinVerified: false
  };
  const header: string[] = [];
  for (const line of lines) {
    if (!line) continue;
    if (sectionFromLine(line)) break;
    header.push(line);
    if (header.length >= 40) break;
  }
  const headerText = header.join("\n");
  const fullText = lines.join("\n");
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const phonePattern = /(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/;
  const linkedinPattern = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9._-]{3,100})/i;
  contact.email = (headerText.match(emailPattern) || fullText.match(emailPattern) || [""])[0];
  contact.phone = (headerText.match(phonePattern) || fullText.match(phonePattern) || [""])[0];
  const linkedin = headerText.match(linkedinPattern) || fullText.match(linkedinPattern);
  if (linkedin?.[1]) contact.linkedin = `linkedin.com/in/${linkedin[1].replace(/\/$/, "")}`;
  const location = headerText.match(/\b([A-Za-z][A-Za-z .'-]{1,40},\s*[A-Z]{2})\b/);
  if (location && !/linkedin|https?:|@/i.test(location[0])) contact.location = location[1].replace(/\s+/g, " ").trim();
  return contact;
}

function resumeContactFlags(contact?: Partial<CandidateContactInfo> | null) {
  return {
    hasEmail: Boolean(contact?.email?.trim()),
    hasPhone: Boolean(contact?.phone?.trim()),
    hasLinkedIn: Boolean(contact?.linkedin?.trim()),
    hasLocation: Boolean(contact?.location?.trim())
  };
}

function withDevelopmentContact<T extends Record<string, unknown>>(
  safe: T,
  contact?: Partial<CandidateContactInfo> | null,
  extra?: Record<string, unknown>
) {
  if (process.env.NODE_ENV !== "development") return safe;
  return {
    ...safe,
    ...extra,
    contact: {
      email: contact?.email || "",
      phone: contact?.phone || "",
      linkedin: contact?.linkedin || "",
      location: contact?.location || ""
    }
  };
}

export function resumeParseLog(result: ParsedDossierPayload) {
  const safe = {
    event: "resume_parse",
    experienceCount: result.milestones.length,
    achievementCount: result.milestones.reduce((count, milestone) => count + milestone.claims.length, 0),
    skillCount: result.skills.length,
    highlightCount: result.highlights.length,
    educationCount: result.education.length,
    ...resumeContactFlags(result.contact)
  };
  return withDevelopmentContact(safe, result.contact, {
    fullName: result.fullName,
    headline: result.headline
  });
}

export function resumeImportLog(
  source: string,
  data: {
    milestones?: { claims?: unknown[] }[];
    skills?: unknown[];
    highlights?: unknown[];
    contact?: Partial<CandidateContactInfo> | null;
  }
) {
  const milestones = Array.isArray(data.milestones) ? data.milestones : [];
  const safe = {
    event: "resume_import_applied",
    source,
    experienceCount: milestones.length,
    achievementCount: milestones.reduce(
      (count, milestone) => count + (Array.isArray(milestone.claims) ? milestone.claims.length : 0),
      0
    ),
    skillCount: Array.isArray(data.skills) ? data.skills.length : 0,
    highlightCount: Array.isArray(data.highlights) ? data.highlights.length : 0,
    ...resumeContactFlags(data.contact)
  };
  return withDevelopmentContact(safe, data.contact);
}

export function parseComprehensiveResume(rawText: string): ParsedDossierPayload {
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, " - ")
    .replace(/\t/g, " ");

  const rawLines = joinWrappedState(normalized.split("\n").map((l) => l.trim()));

  let fullName = "";
  let headline = "";
  let summaryStatement = "";
  const skills: string[] = [];
  const education: ExtractedEducation[] = [];
  const milestones: ExtractedMilestone[] = [];
  const contact = extractContact(rawLines);

  const nonBlank = rawLines.filter(Boolean);
  const nameLine = nonBlank.find(
    (line) =>
      line.length < 60 &&
      !line.includes("|") &&
      !line.includes("@") &&
      !/linkedin\.com/i.test(line) &&
      !tenureSpan(line) &&
      !sectionFromLine(line) &&
      !/^\+?\d[\d\s().-]{6,}$/.test(line)
  );
  if (nameLine) fullName = nameLine.replace(/[•]/g, "").trim();

  type SectionType = "HEADER" | "SUMMARY" | "HIGHLIGHTS" | "EXPERIENCE" | "SKILLS" | "EDUCATION" | "OTHER";
  let currentSection: SectionType = "HEADER";

  const sectionLines: Record<SectionType, string[]> = {
    HEADER: [],
    SUMMARY: [],
    HIGHLIGHTS: [],
    EXPERIENCE: [],
    SKILLS: [],
    EDUCATION: [],
    OTHER: []
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line) continue;

    const heading = sectionFromLine(line);
    if (heading) {
      currentSection = heading.section;
      if (heading.rest) sectionLines[heading.section].push(heading.rest);
      continue;
    }

    sectionLines[currentSection].push(line);
  }

  if (sectionLines.SUMMARY.length > 0) {
    summaryStatement = sectionLines.SUMMARY
      .map(cleanBodySentence)
      .filter((l) => l.replace(/[^a-zA-Z]/g, "").length >= 10)
      .join(" ")
      .replace(/\s{2,}/g, " ");
  }

  if (sectionLines.SKILLS.length > 0) {
    const skillGroups: string[] = [];
    for (const line of sectionLines.SKILLS) {
      const startsNew = /^[●•\*–—◦‣⁃·]/.test(line) || /^-\s+/.test(line);
      const stripped = line.replace(/^[●•\*–—◦‣⁃·]+\s*/, "").replace(/^-\s+/, "");
      if (startsNew || skillGroups.length === 0) skillGroups.push(stripped);
      else skillGroups[skillGroups.length - 1] += ` ${stripped}`;
    }
    const rawSkillsText = skillGroups.map((group) => {
      const colon = group.indexOf(":");
      return colon >= 0 ? group.slice(colon + 1) : group;
    }).join(", ");
    const skillTokens = splitSkillText(rawSkillsText)
      .map(cleanEntityHeader)
      .filter((s) => s.length > 1 && s.length < 50 && !/^(Languages|Frameworks|Tools|Methodologies):?$/i.test(s));

    skillTokens.forEach((s) => {
      if (isEducationItem(s)) {
        education.push({
          id: `edu-token-${Date.now()}-${education.length}`,
          institution: s,
          degree: "Degree / Academic Credential"
        });
      } else if (!skills.some((existing) => existing.toLowerCase() === s.toLowerCase()) && s.length >= 2) {
        skills.push(s);
      }
    });
  }

  if (sectionLines.EDUCATION.length > 0) {
    for (let i = 0; i < sectionLines.EDUCATION.length; i++) {
      const line = sectionLines.EDUCATION[i];
      if (/^[●•\-\*–—◦‣⁃·\s]+$/.test(line)) continue;

      const cleanedLine = cleanEntityHeader(line);
      if (!isEducationItem(cleanedLine) && cleanedLine.length < 45 && !cleanedLine.includes("|")) {
        if (!skills.some((s) => s.toLowerCase() === cleanedLine.toLowerCase()) && cleanedLine.length > 2) {
          skills.push(cleanedLine);
        }
        continue;
      }

      if (line.includes("|")) {
        const parts = line.replace(/^[●•\*–—◦‣⁃·]+\s*/, "").split("|").map((p) => cleanEntityHeader(p));
        const fields = educationFields(parts);
        education.push({
          id: `edu-${Date.now()}-${education.length}`,
          institution: fields.institution,
          degree: fields.degree,
          year: parts[2] ? normalizeTenurePeriod(parts[2]) : undefined
        });
      } else if (cleanedLine.length > 5 && !line.startsWith("●") && !line.startsWith("•")) {
        education.push({
          id: `edu-${Date.now()}-${education.length}`,
          institution: cleanedLine,
          degree: sectionLines.EDUCATION[i + 1] ? cleanEntityHeader(sectionLines.EDUCATION[i + 1]) : "Degree Program"
        });
        i++;
      }
    }
  }

  const yearPattern = /\b(?:19\d{2}|20\d{2})\b/i;
  interface RoleBlock {
    company: string;
    role: string;
    period: string;
    location?: string;
    lines: string[];
  }

  const roleBlocks: RoleBlock[] = [];
  let currentBlock: RoleBlock | null = null;
  const pendingTitles: string[] = [];

  for (let i = 0; i < sectionLines.EXPERIENCE.length; i++) {
    const line = sectionLines.EXPERIENCE[i];
    if (!line) continue;

    const isHeader = line.includes("|") && yearPattern.test(line);

    if (isHeader) {
      if (currentBlock) {
        roleBlocks.push(currentBlock);
      }

      const pipeParts = line.split("|").map((p) => p.trim());
      const company = pipeParts[0] || "Career Chapter";
      const role = pipeParts[1] || "Leadership Role";
      const rawPeriod = pipeParts[2] || "Confirmed Tenure";
      const loc = pipeParts[3] || "Remote";
      const period = normalizeTenurePeriod(rawPeriod);

      if (roleBlocks.length === 0 && role) headline = role;

      currentBlock = {
        company: cleanEntityHeader(company),
        role: cleanEntityHeader(role),
        period,
        location: loc,
        lines: []
      };
      pendingTitles.length = 0;
      continue;
    }

    const combined = headerBesideTenure(line);
    if (combined) {
      if (currentBlock) roleBlocks.push(currentBlock);
      if (roleBlocks.length === 0 && combined.role) headline = combined.role;
      currentBlock = { ...combined, lines: [] };
      pendingTitles.length = 0;
      continue;
    }

    if (isSectionLabel(line)) continue;

    const bareChapter = pipeChapterWithoutYear(line);
    if (bareChapter) {
      if (currentBlock) {
        if (pendingTitles.length) currentBlock.lines.push(...pendingTitles.splice(0));
        roleBlocks.push(currentBlock);
      }
      pendingTitles.length = 0;
      currentBlock = {
        company: cleanEntityHeader(bareChapter.company),
        role: cleanEntityHeader(bareChapter.role),
        period: "",
        lines: bareChapter.claim ? [bareChapter.claim] : []
      };
      continue;
    }

    if (isTenureOnly(line)) {
      if (currentBlock) roleBlocks.push(currentBlock);
      const titles = pendingTitles.splice(0, pendingTitles.length);
      const company = titles[0] || "Career Chapter";
      const role = titles.slice(1).join(" ") || "Role";
      if (roleBlocks.length === 0 && titles.length > 1) headline = role;
      currentBlock = {
        company: cleanEntityHeader(company),
        role: cleanEntityHeader(role),
        period: normalizeTenurePeriod(line),
        lines: []
      };
      continue;
    }

    if (currentBlock && looksLikeTitle(line)) {
      pendingTitles.push(cleanEntityHeader(line));
      if (pendingTitles.length > 2) {
        const overflow = pendingTitles.shift();
        if (overflow) currentBlock.lines.push(overflow);
      }
      continue;
    }

    if (currentBlock) {
      if (pendingTitles.length) currentBlock.lines.push(...pendingTitles.splice(0));
      currentBlock.lines.push(line);
    } else if (looksLikeTitle(line)) {
      pendingTitles.push(cleanEntityHeader(line));
      if (pendingTitles.length > 2) pendingTitles.shift();
    }
  }

  if (currentBlock) {
    roleBlocks.push(currentBlock);
  }

  roleBlocks.forEach((block, idx) => {
    const items = extractAtomicAchievements(block.lines);
    const unifiedClaim = items.join(" ");

    milestones.push({
      id: `m-chapter-${Date.now()}-${idx}`,
      company: block.company,
      role: block.role,
      period: block.period,
      location: block.location,
      claims: items,
      calibratedClaim: unifiedClaim,
      isCorroborated: false
    });
  });

  return {
    fullName,
    headline,
    summaryStatement,
    contact,
    skills,
    education,
    milestones,
    highlights: extractAtomicAchievements(sectionLines.HIGHLIGHTS)
  };
}
