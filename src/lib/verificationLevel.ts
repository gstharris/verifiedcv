export type VerificationCounts = {
  peers: number;
  docs: number;
  registry: boolean;
};

export type VerificationStatus = {
  level: 0 | 1 | 2 | 3;
  label: "Self-Attested" | "Verified" | "Verified+";
};

export function getVerificationStatus(counts: VerificationCounts): VerificationStatus {
  if (counts.peers >= 3 || (counts.peers >= 2 && counts.docs >= 1)) {
    return { level: 3, label: "Verified+" };
  }
  if (counts.peers >= 2 || (counts.peers >= 1 && counts.docs >= 1)) {
    return { level: 2, label: "Verified+" };
  }
  if (counts.peers === 1 || counts.docs >= 1) {
    return { level: 1, label: "Verified" };
  }
  return { level: 0, label: "Self-Attested" };
}

export function previewVerificationStatus(
  current: VerificationCounts,
  extra: Partial<VerificationCounts>
): VerificationStatus {
  return getVerificationStatus({
    peers: current.peers + (extra.peers || 0),
    docs: current.docs + (extra.docs || 0),
    registry: current.registry || Boolean(extra.registry)
  });
}
