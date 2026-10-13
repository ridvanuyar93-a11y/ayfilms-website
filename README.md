# ayfilms Website — Deploy-Anleitung

## 1. Erstes Deploy auf Vercel

```bash
cd "ayfilms website"
npx vercel login
npx vercel --prod
```

Beim ersten Mal fragt Vercel nach Projektname etc. — einfach bestätigen.
Danach bekommst du eine `*.vercel.app`-URL zum Testen.

## 2. Kontaktformular aktivieren (WICHTIG)

Das Formular verschickt Mails über ein Gmail-Konto (nodemailer). Dafür braucht ihr
ein **App-Passwort** für das Gmail-Konto, von dem aus die Mails verschickt werden
(muss nicht ayfilms@outlook.de sein — kann auch ein anderes Konto sein, das
AN ayfilms@outlook.de weiterleitet):

1. Auf [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   ein App-Passwort erstellen (2FA muss dafür aktiv sein).
2. In Vercel → Projekt → Settings → Environment Variables zwei Variablen anlegen:
   - `GMAIL_USER` = die Gmail-Adresse, die versendet
   - `GMAIL_APP_PASSWORD` = das generierte App-Passwort (16 Zeichen, ohne Leerzeichen)
3. Neu deployen (`npx vercel --prod`), damit die Variablen greifen.

Ohne diese zwei Variablen gibt das Formular einen Fehler zurück — die Seite selbst
funktioniert trotzdem ganz normal.

## 3. Domain verbinden (ayfilms.de bei netcup)

1. Vercel Dashboard → Projekt → Settings → Domains → `ayfilms.de` hinzufügen
   (auch `www.ayfilms.de` mit anlegen lassen).
2. Vercel zeigt euch einen A-Eintrag (für `@`) und einen CNAME (für `www`) an.
3. Im netcup Customer Control Panel → Domains → ayfilms.de → DNS:
   genau diese beiden Werte eintragen. MX-Einträge (Mail) unangetastet lassen.
4. Warten, bis Vercel bei der Domain einen grünen Haken zeigt — SSL wird automatisch
   eingerichtet.

## 4. Noch offen / To-Do

- **Foto "Über uns"**: Es sollte durch ein Foto von Ridvan mit seiner Frau ersetzt
  werden — das Foto ist aber noch nicht angekommen. Aktuell ist weiterhin
  `img/ridvan.jpg` (Einzelporträt) eingebunden. Sobald das Pärchenfoto vorliegt,
  einfach als `img/ridvan.jpg` ersetzen (gleicher Dateiname, Seitenverhältnis
  ca. 4:5 ideal).
- **Umsatzsteuer-ID**: Falls vorhanden, in `impressum.html` unter „Umsatzsteuer-ID"
  ergänzen (aktuell offen gelassen).

Erledigt: Impressum & Datenschutz sind mit den echten Angaben befüllt, der
Logo-Schriftzug ist auf Textbasis (Cormorant Garamond) umgesetzt, die Galerie
croppt keine Fotos mehr (Hochkant bleibt hochkant, Querformat bleibt quer),
alle Anfragen/Kontakt-Links zeigen auf ayfilms@outlook.de, und die Film-Sektion
spielt jetzt das echte Hochzeitsfilm-Video von YouTube (https://youtu.be/wph0LGFXtzM)
per Klick auf den Play-Button ab, mit einer schlichten "Film"-Überschrift darüber.

## Projektstruktur

```
index.html          Hauptseite
impressum.html       Impressum (Platzhalter)
datenschutz.html      Datenschutzerklärung (Platzhalter)
css/style.css        Gesamtes Styling
js/main.js           Navigation, Lightbox, Formular-Logik
img/                 Fotos (Galerie, Hero-Poster, Bewertungs-Screenshot)
videos/hero.mp4       Komprimiertes Hero-/Reel-Video
api/contact.js        Serverless Function fürs Kontaktformular
```
