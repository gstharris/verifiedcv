import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

function sixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueRestoreCode(
  supabase: SupabaseClient,
  handle: string,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const code = sixDigitCode();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const { error } = await supabase.from("owner_codes").upsert({
    handle,
    email,
    code,
    expires_at: expiresAt
  });

  if (error) {
    return { ok: false, error: error.message || "Could not create a restore code." };
  }

  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "Email delivery is not configured." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: emailError } = await resend.emails.send({
    from: "VerifiedCV <verify@verifiedcv.app>",
    to: email,
    subject: "Your VerifiedCV restore code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Restore your VerifiedCV page</h2>
        <p>Use this code in Studio to unlock <strong>verifiedcv.app/${handle}</strong> from a new browser:</p>
        <p style="font-size: 28px; font-weight: 800; letter-spacing: 4px;">${code}</p>
        <p style="color: #64748b; font-size: 12px;">This code expires in 30 minutes. Anyone with this handle in another browser cannot overwrite your page without it.</p>
      </div>
    `
  });

  if (emailError) {
    return { ok: false, error: emailError.message || "Could not send the restore email." };
  }

  return { ok: true };
}
