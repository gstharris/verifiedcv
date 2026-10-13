export type VerificationQueueItem = {
  id: "email" | "linkedin" | "phone" | "chapter" | "done";
  title: string;
  detail: string;
  company?: string;
  milestoneId?: string;
};

export function nextPortfolioVerificationStep(input: {
  emailVerified?: boolean;
  linkedinVerified?: boolean;
  phoneVerified?: boolean;
  chapters?: Array<{
    id: string;
    company: string;
    level: number;
  }>;
}): VerificationQueueItem {
  if (!input.emailVerified) {
    return {
      id: "email",
      title: "Verify your email",
      detail: "Confirm the inbox on this profile. That is the first recruiter trust check."
    };
  }

  if (!input.linkedinVerified) {
    return {
      id: "linkedin",
      title: "Verify LinkedIn",
      detail: "Connect the LinkedIn account that matches this career history."
    };
  }

  const chapters = input.chapters || [];
  const unverified = chapters.find((chapter) => chapter.level === 0);
  if (unverified) {
    return {
      id: "chapter",
      title: `Verify your time at ${unverified.company}`,
      detail: "Use a matching work email, invite a colleague, or scan an employment document.",
      company: unverified.company,
      milestoneId: unverified.id
    };
  }

  const strengthen = chapters.find((chapter) => chapter.level === 1);
  if (strengthen) {
    return {
      id: "chapter",
      title: `Add more proof for ${strengthen.company}`,
      detail: "A second source, such as a colleague or a work email, marks this chapter Multi-source.",
      company: strengthen.company,
      milestoneId: strengthen.id
    };
  }

  if (!input.phoneVerified) {
    return {
      id: "phone",
      title: "Verify your phone (optional)",
      detail: "A verified mobile number helps colleagues and recruiters know it is you."
    };
  }

  return {
    id: "done",
    title: "Portfolio verification is in good shape",
    detail: "Identity is confirmed and every chapter has proof. You can still invite more colleagues."
  };
}

function joinList(items: string[]) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function verificationStatusLine(input: {
  emailVerified?: boolean;
  linkedinVerified?: boolean;
  phoneVerified?: boolean;
  chapters?: Array<{ company: string; level: number }>;
}) {
  const chapters = input.chapters || [];
  const done = [
    input.emailVerified ? "email" : "",
    input.phoneVerified ? "phone" : "",
    input.linkedinVerified ? "LinkedIn" : "",
    ...chapters.filter((chapter) => chapter.level > 0).map((chapter) => `work at ${chapter.company}`)
  ].filter(Boolean);
  const next = [
    !input.emailVerified ? "email" : "",
    !input.linkedinVerified ? "LinkedIn" : "",
    ...chapters.filter((chapter) => chapter.level === 0).map((chapter) => `your work at ${chapter.company}`),
    !input.phoneVerified ? "phone" : ""
  ].filter(Boolean);

  const doneText = done.length ? `${joinList(done)} ${done.length === 1 ? "is" : "are"} confirmed.` : "Nothing is confirmed yet.";
  const lead = doneText.charAt(0).toUpperCase() + doneText.slice(1);
  if (!next.length) return `${lead} You can still ask another colleague.`;
  const nextText = next.length === 1 ? `Verify ${next[0]} next.` : `Verify ${next[0]}, or ${next[1]}, next.`;
  return `${lead} ${nextText}`;
}
