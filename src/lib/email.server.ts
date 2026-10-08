/**
 * Transactional email (server-only) through Resend's HTTP API.
 *
 * Env vars:
 *   RESEND_API_KEY  from resend.com (domain origina.co.za verified there)
 *   EMAIL_FROM      e.g. "Origina <no-reply@origina.co.za>"
 *
 * When RESEND_API_KEY is not set, emails are only logged, and email
 * verification is switched off so nobody gets locked out.
 */

const env = (k: string) => process.env[k]?.trim() || undefined;

export const emailConfigured = Boolean(env("RESEND_API_KEY"));

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function layout(title: string, body: string, button?: { label: string; url: string }): string {
  const btn = button
    ? `<p style="margin:28px 0"><a href="${escapeHtml(button.url)}" style="background:#BED62F;color:#0B1926;padding:14px 22px;border-radius:12px;font-weight:600;text-decoration:none;display:inline-block">${escapeHtml(button.label)}</a></p>
       <p style="font-size:14px;color:#5b6670">Or copy this link into your browser:<br><span style="word-break:break-all">${escapeHtml(button.url)}</span></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f6f1;font-family:Arial,Helvetica,sans-serif;color:#0B1926">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="background:#0B1926;border-radius:16px 16px 0 0;padding:20px 24px;color:#fff;font-size:22px;font-weight:700">origina</div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:28px 24px;font-size:16px;line-height:1.55">
      <h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(title)}</h1>
      ${body}${btn}
    </div>
    <p style="font-size:14px;color:#5b6670;text-align:center;margin-top:16px">Origina. Originality, verified.</p>
  </div></body></html>`;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = env("RESEND_API_KEY");
  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set; would send "${subject}" to ${to}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env("EMAIL_FROM") ?? "Origina <no-reply@origina.co.za>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[email] send failed (${res.status}): ${text.slice(0, 300)}`);
    throw new Error("We couldn't send the email. Please try again shortly.");
  }
}

export function verificationEmail(name: string, url: string): string {
  return layout(
    "Confirm your email",
    `<p>Hi ${escapeHtml(name || "there")},</p><p>Please confirm your email address to finish setting up your Origina account. This link expires in 24 hours.</p>`,
    { label: "Confirm email", url },
  );
}

export function resetPasswordEmail(name: string, url: string): string {
  return layout(
    "Reset your password",
    `<p>Hi ${escapeHtml(name || "there")},</p><p>Someone asked to reset the password for your Origina account. If it was you, use the button below. The link expires in 1 hour.</p><p>If you didn't ask for this, you can ignore this email.</p>`,
    { label: "Choose a new password", url },
  );
}

export function paymentReceivedEmail(orgName: string, amount: string, paidUntil: string): string {
  return layout(
    "Payment received",
    `<p>Thank you. We've received ${escapeHtml(amount)} for <strong>${escapeHtml(orgName)}</strong>'s Origina Pro subscription.</p><p>Your access runs until ${escapeHtml(paidUntil)} and renews automatically each month.</p>`,
  );
}
