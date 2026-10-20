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

// Herkunftsdaten (UTM etc.) bereinigen: nur bekannte Felder, kurz, ohne Steuerzeichen
function cleanAttribution(a) {
  const out = {};
  if (!a || typeof a !== "object") return out;
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "fbclid", "landing", "referrer"].forEach((k) => {
    if (a[k]) out[k] = String(a[k]).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 150);
  });
  return out;
}

// Lesbare Kurzbeschreibung der Herkunft
function describeSource(a) {
  if (a.utm_source || a.utm_campaign || a.utm_content) {
    return [a.utm_source, a.utm_medium, a.utm_campaign, a.utm_content].filter(Boolean).join(" / ");
  }
  if (a.fbclid) return "Meta-Klick (fbclid, ohne UTM)";
  const r = (a.referrer || "").toLowerCase();
  if (/instagram|facebook|fb\.com|l\.facebook/.test(r)) return `Instagram/Facebook (${a.referrer}), ohne UTM`;
  if (/google/.test(r)) return `Google (${a.referrer})`;
  if (r) return `Verweis: ${a.referrer}`;
  return "Direkt / unbekannt";
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
    const attr = cleanAttribution(body.attribution);
    const source = describeSource(attr);

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

    const subject = "HOCHZEITSANFRAGE AYFILMS 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨" + (attr.utm_source || attr.fbclid ? ` | ${attr.utm_content || attr.utm_campaign || "Meta"}` : "");

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
      message ? `Nachricht:\n${message}` : null,
      "",
      "--- Herkunft ---",
      `Quelle: ${source}`,
      attr.utm_campaign ? `Kampagne: ${attr.utm_campaign}` : null,
      attr.utm_content ? `Anzeige (utm_content): ${attr.utm_content}` : null,
      attr.utm_term ? `Anzeigengruppe (utm_term): ${attr.utm_term}` : null,
      attr.fbclid ? "Meta-Klick-ID (fbclid): vorhanden" : null,
      attr.referrer ? `Referrer: ${attr.referrer}` : null,
      attr.landing ? `Einstiegsseite: ${attr.landing}` : null
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
        <hr style="border:none;border-top:1px solid #ddd;margin:20px 0 10px;">
        <p style="margin:0 0 6px;color:#888;">Herkunft</p>
        <table cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
          <tr><td style="color:#888;">Quelle</td><td><strong>${escapeHtml(source)}</strong></td></tr>
          ${attr.utm_campaign ? `<tr><td style="color:#888;">Kampagne</td><td>${escapeHtml(attr.utm_campaign)}</td></tr>` : ""}
          ${attr.utm_content ? `<tr><td style="color:#888;">Anzeige</td><td>${escapeHtml(attr.utm_content)}</td></tr>` : ""}
          ${attr.utm_term ? `<tr><td style="color:#888;">Anzeigengruppe</td><td>${escapeHtml(attr.utm_term)}</td></tr>` : ""}
          ${attr.fbclid ? `<tr><td style="color:#888;">Meta-Klick</td><td>fbclid vorhanden</td></tr>` : ""}
          ${attr.referrer ? `<tr><td style="color:#888;">Referrer</td><td>${escapeHtml(attr.referrer)}</td></tr>` : ""}
        </table>
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
