export type CorroborationStatus = "verified" | "pending" | "declined";

export type CorroborationRequestView = {
  email: string;
  status: CorroborationStatus;
  label: "Verified" | "Pending" | "Declined";
  sentOn: string;
};

const LABELS: Record<CorroborationStatus, CorroborationRequestView["label"]> = {
  verified: "Verified",
  pending: "Pending",
  declined: "Declined"
};

export function corroborationStatus(raw: unknown): CorroborationStatus {
  const status = String(raw || "").trim().toUpperCase();
  if (status === "CONFIRMED" || status === "VERIFIED") return "verified";
  if (status === "REJECTED" || status === "DECLINED") return "declined";
  return "pending";
}

export function corroborationSentLabel(iso: unknown) {
  const date = new Date(String(iso || ""));
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

type RequestRow = {
  milestone_id?: unknown;
  milestoneId?: unknown;
  attestor_email?: unknown;
  attestorEmail?: unknown;
  status?: unknown;
  created_at?: unknown;
  createdAt?: unknown;
};

export function corroborationRequestsForChapter(rows: RequestRow[], milestoneId: string): CorroborationRequestView[] {
  const id = String(milestoneId || "").trim();
  if (!id) return [];

  return rows
    .filter((row) => String(row.milestone_id || row.milestoneId || "") === id)
    .map((row) => {
      const status = corroborationStatus(row.status);
      const created = row.created_at || row.createdAt;
      return {
        email: String(row.attestor_email || row.attestorEmail || "").trim().toLowerCase(),
        status,
        label: LABELS[status],
        sentOn: corroborationSentLabel(created),
        createdAt: new Date(String(created || "")).getTime()
      };
    })
    .filter((row) => row.email.includes("@"))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(({ createdAt: _createdAt, ...view }) => view);
}
