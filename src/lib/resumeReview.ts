const BUZZWORDS = ["synergy", "leverage", "passionate", "dynamic", "results-driven", "guru", "ninja", "rockstar", "spearheaded"];
const TYPOS: Array<[string, string]> = [
  ["teh", "the"],
  ["recieve", "receive"],
  ["seperate", "separate"],
  ["managment", "management"],
  ["acheive", "achieve"],
  ["enviroment", "environment"],
  ["responsiblity", "responsibility"]
];

export type ResumeReview = {
  notes: string[];
  focusId: string;
};

function words(value: string): string[] {
  return value.toLowerCase().match(/[a-z']+/g) || [];
}

export function reviewResume(input: {
  summary?: string;
  chapters?: Array<{ id: string; company?: string; claims?: string[] }>;
}): ResumeReview {
  const notes: string[] = [];
  let focusId = "summary";
  const summary = String(input.summary || "").trim();
  const chapters = input.chapters || [];
  const claims = chapters.flatMap((chapter) =>
    (chapter.claims || []).map((claim) => ({ id: chapter.id, company: chapter.company || "a chapter", text: String(claim || "").trim() }))
  ).filter((claim) => claim.text);

  const typo = [...(summary ? [{ id: "summary", text: summary }] : []), ...claims]
    .map((item) => {
      const hit = TYPOS.find(([wrong]) => words(item.text).includes(wrong));
      return hit ? { id: item.id, wrong: hit[0], right: hit[1] } : null;
    })
    .find(Boolean);
  if (typo) {
    notes.push(`"${typo.wrong}" looks like a typo for "${typo.right}".`);
    focusId = typo.id;
  }

  const thin = claims.find((claim) => !/\d/.test(claim.text) && words(claim.text).length >= 8);
  if (thin) {
    notes.push(`The line at ${thin.company} has no number. Add a metric only if you can share it publicly.`);
    if (focusId === "summary") focusId = thin.id;
  }

  const buzz = claims
    .map((claim) => ({ ...claim, word: BUZZWORDS.find((word) => words(claim.text).includes(word)) }))
    .find((claim) => claim.word);
  if (buzz?.word) {
    notes.push(`"${buzz.word}" is a buzzword. Say what you did instead.`);
    if (focusId === "summary") focusId = buzz.id;
  }

  const openings = claims.map((claim) => words(claim.text)[0]).filter(Boolean);
  const repeated = openings.find((word, index) => openings.indexOf(word) !== index);
  if (repeated) notes.push(`Several lines start with "${repeated}". Vary the opening.`);

  if (!summary && claims.length) notes.push("There is no summary. You can add one, or leave the page as experience only.");
  if (!notes.length) notes.push("The structure looks clear. I did not rewrite anything.");

  return { notes: notes.slice(0, 4), focusId };
}
