(function () {
  "use strict";

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Nav scroll state ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  var burger = document.getElementById("navBurger");
  var navLinks = document.getElementById("navLinks");
  burger.addEventListener("click", function () {
    burger.classList.toggle("is-open");
    navLinks.classList.toggle("is-open");
    document.body.style.overflow = navLinks.classList.contains("is-open") ? "hidden" : "";
  });
  navLinks.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      burger.classList.remove("is-open");
      navLinks.classList.remove("is-open");
      document.body.style.overflow = "";
    });
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Hero video autoplay fallback ---------- */
  var heroVideo = document.getElementById("heroVideo");
  if (heroVideo) {
    var tryPlay = function () { heroVideo.play().catch(function () {}); };
    tryPlay();
    document.addEventListener("touchstart", tryPlay, { once: true, passive: true });
    document.addEventListener("click", tryPlay, { once: true });
  }

  /* ---------- Gallery lightbox ---------- */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCount = document.getElementById("lightboxCount");
  var currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  function updateLightbox() {
    var item = galleryItems[currentIndex];
    lightboxImg.src = item.getAttribute("data-full");
    lightboxImg.alt = item.querySelector("img").alt;
    lightboxCount.textContent = (currentIndex + 1) + " / " + galleryItems.length;
  }
  function nextImg() { currentIndex = (currentIndex + 1) % galleryItems.length; updateLightbox(); }
  function prevImg() { currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length; updateLightbox(); }

  galleryItems.forEach(function (item, i) {
    item.addEventListener("click", function () { openLightbox(i); });
  });
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxNext").addEventListener("click", nextImg);
  document.getElementById("lightboxPrev").addEventListener("click", prevImg);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImg();
    if (e.key === "ArrowLeft") prevImg();
  });

  /* ---------- Film play button (YouTube embed on demand) ---------- */
  var filmPlay = document.getElementById("filmPlay");
  var filmEmbed = document.getElementById("filmEmbed");
  var filmContent = document.getElementById("filmContent");
  if (filmPlay && filmEmbed) {
    filmPlay.addEventListener("click", function () {
      var videoId = filmEmbed.getAttribute("data-video-id");
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + videoId + "?autoplay=1&rel=0&playsinline=1";
      iframe.title = "ayfilms Film";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      filmEmbed.appendChild(iframe);
      filmEmbed.classList.add("is-active");
      if (filmContent) filmContent.style.display = "none";
    });
  }

  /* ---------- FAB + Modal ---------- */
  var fabBtn = document.getElementById("fabBtn");
  var modalOverlay = document.getElementById("modalOverlay");
  var modalClose = document.getElementById("modalClose");

  function openModal() {
    modalOverlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    modalOverlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  fabBtn.addEventListener("click", openModal);

  /* Any CTA marked js-open-modal opens the quick-inquiry modal directly,
     instead of scrolling to the full contact section — important for
     ad traffic (Meta etc.) that should be able to convert in one step. */
  document.querySelectorAll(".js-open-modal").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });
  });
  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modalOverlay.classList.contains("is-open")) closeModal();
  });

  /* Hide FAB while the contact section itself is in view */
  var contactSection = document.getElementById("contact");
  if ("IntersectionObserver" in window && contactSection) {
    var fabIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          fabBtn.style.opacity = entry.isIntersecting ? "0" : "1";
          fabBtn.style.pointerEvents = entry.isIntersecting ? "none" : "auto";
        });
      },
      { threshold: 0.25 }
    );
    fabIo.observe(contactSection);
  }

  /* ---------- Form submission (both forms post to /api/contact) ---------- */
  function wireForm(formEl, statusEl, submitBtn, onSuccess) {
    if (!formEl) return;
    formEl.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot check
      var hp = formEl.querySelector('input[name="company"]');
      if (hp && hp.value) return;

      var data = {
        name: formEl.querySelector('input[name="name"]').value.trim(),
        email: formEl.querySelector('input[name="email"]').value.trim(),
        phone: formEl.querySelector('input[name="phone"]').value.trim(),
        date: formEl.querySelector('input[name="date"]').value,
        location: formEl.querySelector('input[name="location"]').value.trim(),
        country: formEl.querySelector('select[name="country"]').value,
        message: formEl.querySelector('textarea[name="message"]').value.trim()
      };

      if (!data.name || !data.email) {
        statusEl.textContent = "Bitte Namen und E-Mail ausfüllen.";
        statusEl.className = "form-status err";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Wird gesendet …";
      statusEl.textContent = "";
      statusEl.className = "form-status";

      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          return res.json();
        })
        .then(function () {
          statusEl.textContent = "Danke! Eure Anfrage ist angekommen — wir melden uns bald. 🤍";
          statusEl.className = "form-status ok";
          formEl.reset();
          submitBtn.textContent = "Anfrage senden";
          submitBtn.disabled = false;
          if (onSuccess) setTimeout(onSuccess, 1600);
        })
        .catch(function () {
          statusEl.textContent = "Da ist etwas schiefgelaufen. Schreibt uns gern direkt an ayfilms@outlook.de.";
          statusEl.className = "form-status err";
          submitBtn.textContent = "Anfrage senden";
          submitBtn.disabled = false;
        });
    });
  }

  wireForm(
    document.getElementById("contactForm"),
    document.getElementById("formStatus"),
    document.getElementById("formSubmitBtn")
  );

  wireForm(
    document.getElementById("contactFormModal"),
    document.getElementById("formStatusModal"),
    document.getElementById("formSubmitBtnModal"),
    closeModal
  );

})();
