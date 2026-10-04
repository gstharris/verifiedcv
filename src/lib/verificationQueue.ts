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
      detail: "A second colleague or a matching work email turns this chapter into Verified+.",
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
