export function publishFailureMessage(body: unknown) {
  if (body && typeof body === "object" && "error" in body) {
    const message = String((body as { error?: unknown }).error || "").trim();
    if (message) return message;
  }
  return "Could not publish changes.";
}

/**
 * A pasted resume can carry an email that already belongs to another page.
 * Publishing the chapters still proceeds. The page keeps the email it already has.
 */
export function publishEmailChoice(input: {
  existingHandle: string;
  existingEmail: string;
  incomingEmail: string;
  takenByHandle: string;
}) {
  const page = input.existingHandle.toLowerCase().trim();
  const incoming = input.incomingEmail.toLowerCase().trim();
  const existing = input.existingEmail.trim();
  const taken = input.takenByHandle.toLowerCase().trim();
  if (!page || !incoming || incoming === existing.toLowerCase() || !taken || taken === page) {
    return { email: input.incomingEmail.trim() || existing, notice: "", kept: false };
  }
  return {
    email: existing,
    notice: `The resume email already belongs to verifiedcv.app/${taken}. This page kept its current email.`,
    kept: true
  };
}
