import type { OutgoingEmail } from "./sender";

export type Delivery = {
  send_id: string;
  to_email: string;
  first_name: string | null;
  subject: string;
  body: unknown;
  unsubscribe_token: string;
};

// From the prototype's preview footer.
const FOOTER = "You're getting this email because you're a member of the Social Development Centre.";

/**
 * One send as an email. The body's format belongs to the Email Editor (its own PRD); until then a
 * body is `{ "text": "..." }`. "[First name]" fills in for each member.
 */
export function renderDelivery(delivery: Delivery, origin: string): OutgoingEmail {
  const personalize = (value: string) =>
    value.replaceAll("[First name]", delivery.first_name?.trim() || "there");
  const unsubscribeUrl = new URL(`/unsubscribe/${delivery.unsubscribe_token}`, origin).toString();
  const message = personalize(bodyText(delivery.body));

  return {
    to: delivery.to_email,
    subject: personalize(delivery.subject),
    unsubscribeUrl,
    text: `${message}\n\n--\n${FOOTER}\nUnsubscribe: ${unsubscribeUrl}\n`,
    html:
      message
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
        .join("") +
      `<hr><p><small>${escapeHtml(FOOTER)} <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a></small></p>`,
  };
}

function bodyText(body: unknown): string {
  if (body && typeof body === "object" && "text" in body && typeof body.text === "string") {
    return body.text;
  }
  return "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
