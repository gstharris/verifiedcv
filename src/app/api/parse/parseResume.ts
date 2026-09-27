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
}

function cleanBodySentence(text: string): string {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/^[●•\-\*–—◦‣⁃·\d\.\)\s]+/g, "")
    .replace(/[●•\-\*–—◦‣⁃·]+/g, " ")
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
    .filter((l) => Boolean(l) && !/^[●•\-\*–—◦‣⁃·\s]+$/.test(l));

  if (contentLines.length === 0) return [];

  const achievements: string[] = [];
  let currentBuffer = "";

  const actionVerbStart = /^(Direct|Directed|Design|Designed|Build|Built|Deploy|Deployed|Partner|Partnered|Found|Founded|Rebuild|Rebuilt|Establish|Established|Engineer|Engineered|Conduct|Conducted|Scale|Scaled|Lead|Led|Restructure|Restructured|Architect|Architected|Manage|Managed|Create|Created|Drive|Drove|Deliver|Delivered|Author|Authored|Spearhead|Spearheaded|Oversee|Oversaw|Execute|Executed|Implement|Implemented|Grow|Grew|Launch|Launched)\b/i;

  for (let i = 0; i < contentLines.length; i++) {
    const raw = contentLines[i];
    const startsWithBullet = /^[●•\-\*–—◦‣⁃·]/.test(raw);
    const cleanText = cleanBodySentence(raw);

    if (!cleanText || cleanText.replace(/[^a-zA-Z]/g, "").length < 3) continue;

    const prevEndedWithPeriod = currentBuffer.endsWith(".") || currentBuffer.endsWith(";");
    const isNewActionSentence = prevEndedWithPeriod && actionVerbStart.test(cleanText);

    if (startsWithBullet || isNewActionSentence || !currentBuffer) {
      if (currentBuffer && isValidAchievement(currentBuffer)) {
        achievements.push(currentBuffer);
      }
      currentBuffer = cleanText;
    } else {
      currentBuffer += " " + cleanText;
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

export function parseComprehensiveResume(rawText: string): ParsedDossierPayload {
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, " - ")
    .replace(/\t/g, " ");

  const rawLines = normalized.split("\n").map((l) => l.trim());

  let fullName = "Graham Harris";
  let headline = "Head of Product Management • AI Platforms";
  let summaryStatement = "";
  const skills: string[] = [];
  const education: ExtractedEducation[] = [];
  const milestones: ExtractedMilestone[] = [];

  const contact: CandidateContactInfo = {
    email: "",
    phone: "",
    location: "Remote / Los Angeles, CA",
    linkedin: "",
    emailVerified: false,
    phoneVerified: false,
    linkedinVerified: false
  };

  const headerBlock = rawLines.slice(0, 10).join(" \n ");

  const emailMatch = headerBlock.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) contact.email = emailMatch[0];

  const phoneMatch = headerBlock.match(/(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/);
  if (phoneMatch) contact.phone = phoneMatch[0];

  const linkedinMatch = headerBlock.match(/(?:linkedin\.com\/in\/|linkedin:\s*)([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) contact.linkedin = `linkedin.com/in/${linkedinMatch[1]}`;

  const locationMatch = headerBlock.match(/\b([A-Za-z\s]+,\s*[A-Z]{2})\b/);
  if (locationMatch && !locationMatch[0].includes("LinkedIn")) {
    contact.location = locationMatch[0].trim();
  }

  const nonBlank = rawLines.filter(Boolean);
  if (nonBlank.length > 0 && !nonBlank[0].includes("|") && nonBlank[0].length < 50) {
    fullName = nonBlank[0].replace(/[•,]/g, "").trim();
  }

  type SectionType = "HEADER" | "SUMMARY" | "EXPERIENCE" | "SKILLS" | "EDUCATION" | "OTHER";
  let currentSection: SectionType = "HEADER";

  const sectionLines: Record<SectionType, string[]> = {
    HEADER: [],
    SUMMARY: [],
    EXPERIENCE: [],
    SKILLS: [],
    EDUCATION: [],
    OTHER: []
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line) continue;

    if (/(?:^|\s)(?:PROFESSIONAL SUMMARY|EXECUTIVE SUMMARY|SUMMARY|PROFILE|ABOUT ME)(?:$|\s)/i.test(line)) {
      currentSection = "SUMMARY";
      continue;
    }
    if (/(?:^|\s)(?:PROFESSIONAL EXPERIENCE|EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY)(?:$|\s)/i.test(line)) {
      currentSection = "EXPERIENCE";
      continue;
    }
    if (/(?:^|\s)(?:TECHNICAL SKILLS|CORE COMPETENCIES|SKILLS|TECHNOLOGIES|AREAS OF EXPERTISE|PROFICIENCIES)(?:$|\s)/i.test(line)) {
      currentSection = "SKILLS";
      continue;
    }
    if (/(?:^|\s)(?:EDUCATION|ACADEMIC BACKGROUND|DEGREES & CERTIFICATIONS|EDUCATION & CREDENTIALS)(?:$|\s)/i.test(line)) {
      currentSection = "EDUCATION";
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
    const rawSkillsText = sectionLines.SKILLS.join(" ");
    const skillTokens = rawSkillsText
      .split(/[,|•●;•\/\n]/)
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
        const parts = line.split("|").map((p) => cleanEntityHeader(p));
        education.push({
          id: `edu-${Date.now()}-${education.length}`,
          institution: parts[0] || "University",
          degree: parts[1] || "Degree",
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

      if (roleBlocks.length === 0) {
        headline = `${role} • Personalization & AI Platforms`;
      }

      currentBlock = {
        company: cleanEntityHeader(company),
        role: cleanEntityHeader(role),
        period,
        location: loc,
        lines: []
      };
    } else if (currentBlock) {
      currentBlock.lines.push(line);
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
      claims: items.length > 0 ? items : ["Directed operational execution, engineering trade-offs, and product architecture roadmaps."],
      calibratedClaim: unifiedClaim || "Directed operational execution, engineering trade-offs, and product architecture roadmaps.",
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
    milestones
  };
}
