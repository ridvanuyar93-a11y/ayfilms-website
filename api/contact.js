const nodemailer = require("nodemailer");

const TARGET_EMAIL = "ayfilms@outlook.de";

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { name, email, phone, date, location, country, message, company } = body;

    // Honeypot — silently accept but do nothing
    if (company) {
      return res.status(200).json({ ok: true });
    }

    if (!name || !email) {
      return res.status(400).json({ error: "Name und E-Mail sind erforderlich." });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ error: "Ungültige E-Mail-Adresse." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const subject = "HOCHZEITSANFRAGE AYFILMS 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨";

    const textBody = [
      "Neue Hochzeitsanfrage über ayfilms.de",
      "",
      `Namen: ${name}`,
      `E-Mail: ${email}`,
      phone ? `Telefon: ${phone}` : null,
      date ? `Datum: ${date}` : null,
      location ? `Location / Ort: ${location}` : null,
      country ? `Land: ${country}` : null,
      message ? `Nachricht:\n${message}` : null
    ]
      .filter(Boolean)
      .join("\n");

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222;">
        <h2 style="margin:0 0 16px;">🚨 Neue Hochzeitsanfrage über ayfilms.de</h2>
        <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
          <tr><td style="color:#888;">Namen</td><td><strong>${escapeHtml(name)}</strong></td></tr>
          <tr><td style="color:#888;">E-Mail</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          ${phone ? `<tr><td style="color:#888;">Telefon</td><td>${escapeHtml(phone)}</td></tr>` : ""}
          ${date ? `<tr><td style="color:#888;">Datum</td><td>${escapeHtml(date)}</td></tr>` : ""}
          ${location ? `<tr><td style="color:#888;">Location / Ort</td><td>${escapeHtml(location)}</td></tr>` : ""}
          ${country ? `<tr><td style="color:#888;">Land</td><td>${escapeHtml(country)}</td></tr>` : ""}
        </table>
        ${message ? `<p style="margin-top:18px;color:#888;">Nachricht:</p><p style="white-space:pre-wrap;">${escapeHtml(message)}</p>` : ""}
      </div>
    `;

    await transporter.sendMail({
      from: `"ayfilms Website" <${process.env.GMAIL_USER}>`,
      to: TARGET_EMAIL,
      replyTo: email,
      subject: subject,
      text: textBody,
      html: htmlBody
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return res.status(500).json({ error: "Interner Fehler. Bitte später erneut versuchen." });
  }
};
