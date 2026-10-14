const nodemailer = require("nodemailer");

// Empfänger: optional CONTACT_TO, sonst das Gmail-Konto, das auch versendet (GMAIL_USER)
function getTarget() {
  return process.env.CONTACT_TO || process.env.GMAIL_USER;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Instagram-Angabe bereinigen: @, Profil-Link und Leerzeichen entfernen, nur gültige Zeichen
function cleanInstagram(v) {
  let h = String(v || "").trim();
  h = h.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "");
  h = h.replace(/^@+/, "").replace(/\s+/g, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? h : "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { name, email, phone, date, location, country, message, company } = body;
    const instagram = cleanInstagram(body.instagram);

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
      instagram ? `Instagram: @${instagram} (https://instagram.com/${instagram})` : null,
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
          ${instagram ? `<tr><td style="color:#888;">Instagram</td><td><a href="https://instagram.com/${escapeHtml(instagram)}">@${escapeHtml(instagram)}</a></td></tr>` : ""}
          ${date ? `<tr><td style="color:#888;">Datum</td><td>${escapeHtml(date)}</td></tr>` : ""}
          ${location ? `<tr><td style="color:#888;">Location / Ort</td><td>${escapeHtml(location)}</td></tr>` : ""}
          ${country ? `<tr><td style="color:#888;">Land</td><td>${escapeHtml(country)}</td></tr>` : ""}
        </table>
        ${message ? `<p style="margin-top:18px;color:#888;">Nachricht:</p><p style="white-space:pre-wrap;">${escapeHtml(message)}</p>` : ""}
      </div>
    `;

    await transporter.sendMail({
      from: `"ayfilms Website" <${process.env.GMAIL_USER}>`,
      to: getTarget(),
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
