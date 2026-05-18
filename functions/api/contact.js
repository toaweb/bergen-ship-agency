/**
 * Cloudflare Pages Function — contact form submission handler.
 *
 * Required env vars (set via Pages dashboard → Settings → Environment variables):
 *   RESEND_API_KEY  — API key from https://resend.com (verify bergenshipagency.no first)
 *
 * Optional env vars (sensible defaults):
 *   CONTACT_FROM    — RFC-5322 From header (must use a Resend-verified domain)
 *   CONTACT_TO      — destination address (defaults to post@bergenshipagency.no)
 *
 * Local testing: `hugo --minify && wrangler pages dev public` (after `npm i -g wrangler`).
 */

const MAX_NAME = 200;
const MAX_MESSAGE = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) {
    return json({ error: "Email service not configured" }, 500);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid form submission" }, 400);
  }

  // Honeypot: bots fill hidden fields, humans don't. Silently 200 so bots
  // don't learn the field is a trap.
  if ((form.get("website") || "").toString().trim() !== "") {
    return json({ ok: true });
  }

  const name = str(form.get("name"));
  const email = str(form.get("email"));
  const company = str(form.get("company"));
  const phone = str(form.get("phone"));
  const message = str(form.get("message"));

  if (!name || !email || !message) {
    return json({ error: "Name, email, and message are required." }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }
  if (name.length > MAX_NAME || message.length > MAX_MESSAGE) {
    return json({ error: "Submission too long." }, 400);
  }

  const from = env.CONTACT_FROM || "Bergen Ship Agency <noreply@bergenshipagency.no>";
  const to = env.CONTACT_TO || "post@bergenshipagency.no";

  const html = renderEmail({ name, email, company, phone, message });

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `Contact form: ${name}`,
      html,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text().catch(() => "");
    console.error("Resend error", resendRes.status, detail);
    return json({ error: "Failed to send message. Please try again or call us." }, 502);
  }

  return json({ ok: true });
}

function str(v) {
  return (v ?? "").toString().trim();
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function renderEmail({ name, email, company, phone, message }) {
  const rows = [
    ["Name", name],
    ["Email", email],
    ["Company", company],
    ["Phone", phone],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#666"><strong>${k}</strong></td><td style="padding:6px 0">${esc(v)}</td></tr>`)
    .join("");

  return `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,sans-serif;color:#1e1a16;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="color:#0a1628;margin:0 0 16px">New contact form submission</h2>
  <table style="border-collapse:collapse">${rows}</table>
  <h3 style="color:#0a1628;margin:24px 0 8px">Message</h3>
  <pre style="font-family:inherit;white-space:pre-wrap;background:#f8f7f4;padding:16px;border-radius:6px;margin:0">${esc(message)}</pre>
  <p style="color:#9b9590;font-size:0.85em;margin-top:24px">Reply directly to this email to respond to ${esc(name)}.</p>
</body></html>`;
}
