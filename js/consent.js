/* ==========================================================================
   Cookie-Einwilligung + Meta-Pixel (lädt erst nach Zustimmung)
   Pixel-ID eintragen: unten bei PIXEL_ID. Solange sie leer ist, wird weder
   ein Banner angezeigt noch irgendein Tracking geladen.
   ========================================================================== */
(function () {
  "use strict";

  var PIXEL_ID = ""; // z. B. "123456789012345"
  var KEY = "ayf_consent_v1";
  var memory = null; // Fallback, falls localStorage blockiert ist
  var pixelLoaded = false;

  function readConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return memory; }
  }
  function writeConsent(v) {
    memory = v;
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  function loadPixel() {
    if (pixelLoaded || !PIXEL_ID) return;
    pixelLoaded = true;
    /* Standard Meta-Pixel-Basiscode */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
  }

  /* Öffentliche Funktion: nur senden, wenn zugestimmt wurde */
  window.ayfTrack = function (name, params, custom) {
    if (!pixelLoaded || !window.fbq) return;
    try {
      window.fbq(custom ? "trackCustom" : "track", name, params || {});
    } catch (e) {}
  };

  function removeBanner() {
    var el = document.getElementById("consentBanner");
    if (el) el.parentNode.removeChild(el);
  }

  function showBanner() {
    if (document.getElementById("consentBanner")) return;
    var box = document.createElement("div");
    box.id = "consentBanner";
    box.className = "consent-banner";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Cookie-Einstellungen");
    box.innerHTML =
      '<p class="consent-text">Wir möchten mit dem Meta-Pixel messen, ob unsere Werbung bei Instagram und Facebook ' +
      'funktioniert. Dabei werden Daten an Meta übermittelt. Das passiert nur mit eurer Zustimmung. ' +
      'Mehr dazu in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="consent-btn" id="consentDecline">Ablehnen</button>' +
      '<button type="button" class="consent-btn" id="consentAccept">Akzeptieren</button>' +
      "</div>";
    document.body.appendChild(box);
    document.getElementById("consentAccept").addEventListener("click", function () {
      writeConsent("granted");
      removeBanner();
      loadPixel();
    });
    document.getElementById("consentDecline").addEventListener("click", function () {
      writeConsent("denied");
      removeBanner();
    });
  }

  function init() {
    if (!PIXEL_ID) return; // kein Tracking konfiguriert => kein Banner nötig
    var c = readConsent();
    if (c === "granted") loadPixel();
    else if (c !== "denied") showBanner();

    /* "Cookie-Einstellungen" im Footer: Auswahl erneut öffnen */
    document.querySelectorAll("[data-cookie-settings]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        showBanner();
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
