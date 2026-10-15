export type StudioMessage =
  | { type: "pass" }
  | { type: "unknown" }
  | { type: "help" }
  | { type: "next" }
  | { type: "skills"; skill: string | null }
  | { type: "sample_work" }
  | { type: "resume" }
  | { type: "education" }
  | { type: "summary" }
  | { type: "headline" }
  | { type: "name" }
  | { type: "location" }
  | { type: "highlights" }
  | { type: "chapters"; create: boolean }
  | { type: "layout" }
  | { type: "save" }
  | { type: "colleague" }
  | { type: "document" }
  | { type: "review" }
  | { type: "work_email" }
  | { type: "identity"; field: "email" | "phone" | "linkedin"; mode: "verify" | "edit" };

const VERIFY_WORDS = ["verify", "validate", "validation", "confirm", "corroborate", "check"];
const COLLEAGUE_WORDS = ["colleague", "colleagues", "coworker", "coworkers", "peer", "peers", "invite", "invitation", "reference"];
const EDIT_WORDS = ["edit", "fix", "change", "update", "revise"];

function editDistance(left: string, right: string) {
  if (left === right) return 0;
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }
  return matrix[left.length][right.length];
}

function variants(word: string) {
  const forms = [word];
  if (word.length > 4 && word.endsWith("s") && !word.endsWith("ss")) forms.push(word.slice(0, -1));
  return forms;
}

function near(left: string, right: string) {
  if (left === right) return true;
  const longer = Math.max(left.length, right.length);
  if (longer < 4) return false;
  const distance = editDistance(left, right);
  if (Math.abs(left.length - right.length) > 1) return false;
  if (distance <= 1) return true;
  return distance <= 2 && longer >= 5 && distance / longer <= 0.34;
}

function close(token: string, target: string) {
  return variants(token).some((left) => variants(target).some((right) => near(left, right)));
}

function wordsOf(text: string) {
  return text
    .toLowerCase()
    .replace(/\be-mail\b/g, "email")
    .replace(/\bw-2\b/g, "w2")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function hasWord(words: string[], targets: string[]) {
  return words.some((word) => targets.some((target) => close(word, target)));
}

function hasPhrase(words: string[], phrase: string) {
  const need = phrase.split(" ");
  for (let i = 0; i <= words.length - need.length; i += 1) {
    if (need.every((part, index) => close(words[i + index], part))) return true;
  }
  return false;
}

function skillToAdd(text: string) {
  const match = text.match(/\b(?:add|include|put)\s+(.+?)\s+(?:to|on|in|into)\s+(?:my\s+)?skills?\b/i);
  if (!match) return null;
  const skill = match[1].replace(/^(?:a|an|the|skill)\s+/i, "").replace(/[?.!]+$/g, "").trim();
  if (!skill || skill.split(/\s+/).length > 4) return null;
  if (/^(my|some|more|another|new|skills?)$/i.test(skill)) return null;
  return skill;
}

function sampleWork(words: string[]) {
  if (
    hasPhrase(words, "sample work") ||
    hasPhrase(words, "work sample") ||
    hasPhrase(words, "case study") ||
    hasPhrase(words, "portfolio piece")
  ) {
    return true;
  }
  if (hasWord(words, ["sample"]) && hasWord(words, ["work", "project", "projects", "piece"])) return true;
  return hasWord(words, ["project", "projects"]) && hasWord(words, ["add", "new", "another", "create", "include"]);
}

function resumeUpload(words: string[]) {
  if (!hasWord(words, ["resume", "cv"])) return false;
  if (hasWord(words, ["review", "grammar", "spelling", "buzzword", ...EDIT_WORDS])) return false;
  return hasWord(words, ["add", "upload", "another", "new", "replace", "second", "more", "import"]);
}

export function interpretStudioMessage(text: string): StudioMessage {
  const raw = String(text || "").trim();
  const folded = raw.toLowerCase();
  const words = wordsOf(raw);
  if (!words.length) return { type: "unknown" };

  if (/\b(what(?:'s| is) next|what should i|what do i do|next step|what now|where do i start)\b/.test(folded)) {
    return { type: "next" };
  }

  if (hasPhrase(words, "work email") || hasPhrase(words, "company email") || hasPhrase(words, "corporate email")) {
    return { type: "work_email" };
  }

  const identityField = hasWord(words, ["linkedin"])
    ? "linkedin"
    : hasWord(words, ["phone", "mobile"])
      ? "phone"
      : hasWord(words, ["email", "inbox"])
        ? "email"
        : null;
  if (identityField && !(identityField === "email" && hasWord(words, COLLEAGUE_WORDS) && !hasWord(words, VERIFY_WORDS))) {
    return {
      type: "identity",
      field: identityField,
      mode: hasWord(words, VERIFY_WORDS) ? "verify" : "edit"
    };
  }

  if (sampleWork(words)) return { type: "sample_work" };

  if (hasWord(words, ["skill", "skills", "skillset", "competency", "competencies", "proficiency", "proficiencies"])) {
    return { type: "skills", skill: skillToAdd(raw) };
  }

  if (hasWord(words, ["education", "school", "degree", "university", "college", "diploma"])) {
    return { type: "education" };
  }

  if (hasWord(words, ["summary", "bio"])) return { type: "summary" };
  if (hasWord(words, ["headline"])) return { type: "headline" };
  if (hasPhrase(words, "my name") || hasPhrase(words, "full name")) return { type: "name" };
  if (hasWord(words, ["location", "city"])) return { type: "location" };
  if (hasWord(words, ["highlight", "highlights"])) return { type: "highlights" };

  if (resumeUpload(words)) return { type: "resume" };

  if (hasWord(words, ["grammar", "spelling", "buzzword", "buzzwords"]) || hasWord(words, ["review"])) {
    return { type: "review" };
  }

  const chapterNoun =
    hasWord(words, ["chapter", "chapters", "experience", "job", "jobs", "bullet", "bullets", "role"]) ||
    (hasWord(words, ["resume", "cv"]) && hasWord(words, EDIT_WORDS));
  if (chapterNoun && !(hasWord(words, VERIFY_WORDS) && !hasWord(words, EDIT_WORDS))) {
    const create = hasWord(words, ["add", "new", "another", "blank"]) && !hasWord(words, EDIT_WORDS);
    return { type: "chapters", create };
  }

  if (hasWord(words, ["layout", "template"]) || hasPhrase(words, "section order")) return { type: "layout" };

  if (
    hasWord(words, ["document", "documents", "w2", "paystub", "contract"]) ||
    hasPhrase(words, "offer letter") ||
    hasPhrase(words, "pay stub")
  ) {
    return { type: "document" };
  }

  if (hasWord(words, COLLEAGUE_WORDS)) return { type: "colleague" };

  if (hasWord(words, ["save", "publish"]) || hasPhrase(words, "claim handle")) return { type: "save" };

  if (
    /\b(what can you|what do you do|what can i ask)\b/.test(folded) ||
    (words.length <= 3 && hasWord(words, ["help"]))
  ) {
    return { type: "help" };
  }

  if (hasWord(words, VERIFY_WORDS)) return { type: "pass" };
  return { type: "unknown" };
}
