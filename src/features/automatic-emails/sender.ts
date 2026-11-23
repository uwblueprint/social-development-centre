import nodemailer from "nodemailer";

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  unsubscribeUrl: string;
};

export type SendResult = { ok: true; messageId: string } | { ok: false; error: string };

export type Sender = { send(email: OutgoingEmail): Promise<SendResult> };

const FROM_NAME = "Social Development Centre";

/**
 * Picks how mail goes out. SMTP needs SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD (the
 * sdcentre@uwblueprint.org account, the same one Supabase uses for sign-in emails); without them,
 * everything is logged instead.
 *
 * Outside production, only addresses in EMAIL_TEST_ALLOWLIST (comma-separated) really receive
 * mail. Everyone else is logged, so a preview or local run against the dev database can't email
 * real members.
 */
export function createSender(): Sender {
  const smtp = smtpFromEnv();
  const log = logSender();
  if (!smtp) return log;
  if (isProduction()) return smtp;

  const allowed = new Set(
    (process.env.EMAIL_TEST_ALLOWLIST ?? "")
      .split(",")
      .map((address) => address.trim().toLowerCase())
      .filter(Boolean),
  );
  return {
    send: (email) => (allowed.has(email.to.toLowerCase()) ? smtp.send(email) : log.send(email)),
  };
}

function isProduction() {
  return process.env.VERCEL_ENV === "production";
}

function smtpFromEnv(): Sender | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) return null;
  const port = Number(SMTP_PORT);
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    // 465 is TLS from the start; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return {
    async send(email) {
      try {
        const info = await transport.sendMail({
          from: { name: FROM_NAME, address: SMTP_USER },
          to: email.to,
          subject: email.subject,
          text: email.text,
          html: email.html,
          headers: { "List-Unsubscribe": `<${email.unsubscribeUrl}>` },
        });
        return { ok: true, messageId: info.messageId };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
  };
}

// Recorded as sent with a "log:" id, so the run finishes the same way it would with real mail.
function logSender(): Sender {
  return {
    async send(email) {
      console.info("[automatic-emails] not sent (log only):", email.to, "·", email.subject);
      return { ok: true, messageId: `log:${crypto.randomUUID()}` };
    },
  };
}
