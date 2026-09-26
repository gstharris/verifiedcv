export type VerificationTier = "tier_1_identity" | "tier_2_peer" | "tier_3_registry";

export interface CorroborationReceipt {
  receiptId: string;
  verifierRole: string; // Role-masked (e.g., "Senior Engineering Leader, Core Infrastructure")
  organization: string;
  tenureOverlapYears: number;
  attestationTimestamp: string;
  cryptographicHash: string;
  channel: "corporate_oauth" | "domain_mailbox" | "uspto_registry" | "sec_edgar";
}

export interface CareerArtifact {
  id: string;
  title: string;
  type: "patent" | "architecture_brief" | "publication" | "confidential_deck";
  referenceUri?: string;
  hash: string;
  isPasswordGated: boolean;
}

export interface AtomicMilestone {
  id: string;
  company: string;
  role: string;
  period: string;
  rawText: string;
  calibratedClaim: string;
  metrics: {
    label: string;
    value: string;
    tradeoffSummary?: string;
  }[];
  tier: VerificationTier;
  isCorroborated: boolean;
  corroboration?: CorroborationReceipt;
  artifacts?: CareerArtifact[];
  lastAuditedAt?: string;
}

export interface CandidateDossier {
  handle: string;
  fullName: string;
  headline: string;
  location: string;
  verifiedEmailDomain?: string;
  identityConfirmed: boolean;
  vaultAuditHash: string;
  totalYearsExperience: number;
  milestones: AtomicMilestone[];
  updatedAt: string;
}