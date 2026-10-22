document.getElementById('year').textContent = new Date().getFullYear();

// Mobile navigation toggle
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Consent: Google Maps and Google Analytics load only after the visitor
// accepts the cookie banner. The choice is remembered in localStorage
// (not a cookie). The banner is in index.html; on other pages it is added
// here so every page asks before measuring.
const GA_ID = 'G-7399NWEJK5';
const mapEmbed = document.getElementById('map-embed');
const mapConsentAccept = document.getElementById('map-consent-accept');
const MAP_SRC = 'https://www.google.com/maps?q=Via+San+Giovanni+Bosco+41+93017+San+Cataldo+CL&output=embed';

function ensureCookieBanner() {
  let banner = document.getElementById('cookie-banner');
  if (banner) return banner;
  banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.id = 'cookie-banner';
  banner.hidden = true;
  banner.innerHTML =
    '<div class="container cookie-banner-inner">' +
      '<p>Con il tuo consenso usiamo Google Analytics per statistiche aggregate sulle visite e carichiamo la mappa di Google Maps; entrambi possono comportare cookie di terze parti. Il sito non utilizza cookie di profilazione. <a href="/privacy.html">Maggiori informazioni</a>.</p>' +
      '<div class="cookie-banner-actions">' +
        '<button type="button" class="btn btn-outline-dark btn-pill btn-small" id="cookie-reject">Rifiuta</button>' +
        '<button type="button" class="btn btn-on-dark btn-pill btn-small" id="cookie-accept">Accetta</button>' +
      '</div>' +
    '</div>';
  document.body.insertBefore(banner, document.body.firstChild);
  return banner;
}

function loadMap() {
  if (!mapEmbed || mapEmbed.querySelector('iframe')) return;
  const iframe = document.createElement('iframe');
  iframe.src = MAP_SRC;
  iframe.width = '100%';
  iframe.height = '360';
  iframe.style.border = '0';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  iframe.title = 'Mappa: Via San Giovanni Bosco, 41 – San Cataldo (CL)';
  mapEmbed.innerHTML = '';
  mapEmbed.appendChild(iframe);
}

let analyticsLoaded = false;
function loadAnalytics() {
  if (analyticsLoaded || !GA_ID) return;
  analyticsLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
}

function grantConsent() {
  loadMap();
  loadAnalytics();
}

const cookieBanner = ensureCookieBanner();
const cookieAccept = document.getElementById('cookie-accept');
const cookieReject = document.getElementById('cookie-reject');

function hideBanner() {
  if (cookieBanner) cookieBanner.hidden = true;
  document.body.classList.remove('cookie-banner-visible');
}

let storedConsent = null;
try { storedConsent = localStorage.getItem('cookie-consent'); } catch (err) {}

if (storedConsent === 'accepted') {
  grantConsent();
} else if (storedConsent !== 'rejected' && cookieBanner) {
  cookieBanner.hidden = false;
  document.body.classList.add('cookie-banner-visible');
}

function acceptAll() {
  grantConsent();
  try { localStorage.setItem('cookie-consent', 'accepted'); } catch (err) {}
  hideBanner();
}

if (mapConsentAccept) mapConsentAccept.addEventListener('click', acceptAll);
if (cookieAccept) cookieAccept.addEventListener('click', acceptAll);
if (cookieReject) {
  cookieReject.addEventListener('click', () => {
    try { localStorage.setItem('cookie-consent', 'rejected'); } catch (err) {}
    hideBanner();
  });
}

// Contact form: send a background copy to the studio's inbox, then hand the
// client off to their chosen contact channel (WhatsApp / e-mail / phone)
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const WHATSAPP_NUMBER = '393713052304';
const STUDIO_EMAIL = 'avvfussone@virgilio.it';

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const data = new FormData(contactForm);
    const nome = data.get('nome') || '';
    const email = data.get('email') || '';
    const telefono = data.get('telefono') || '';
    const area = data.get('area') || 'non specificata';
    const messaggio = data.get('messaggio') || '';
    const preferenza = data.get('preferenza') || 'Telefono';

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    // Best-effort background copy to the studio's inbox via FormSubmit;
    // the client's own channel below is what they actually see.
    try {
      const payload = {};
      data.forEach((value, key) => { payload[key] = value; });
      await fetch(contactForm.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Network hiccup on the background copy shouldn't block the client's
      // direct channel below.
    }

    const summary =
      `Richiesta di consulenza dal sito\n\n` +
      `Nome e cognome: ${nome}\n` +
      `E-mail: ${email}\n` +
      `Telefono: ${telefono || 'non indicato'}\n` +
      `Area di interesse: ${area}\n\n` +
      `Descrizione della richiesta:\n${messaggio || 'nessuna descrizione fornita'}`;

    if (preferenza === 'WhatsApp') {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(summary)}`, '_blank', 'noopener');
      formStatus.textContent = 'Si è aperto WhatsApp con il messaggio pronto: invialo per completare la richiesta.';
    } else if (preferenza === 'E-mail') {
      const subject = `Richiesta di consulenza - ${nome}`;
      window.location.href = `mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`;
      formStatus.textContent = 'Si è aperto il tuo programma di posta con il messaggio pronto: invialo per completare la richiesta.';
    } else {
      formStatus.textContent = 'Richiesta inviata. Ti contatteremo al numero indicato entro 48 ore lavorative.';
    }

    contactForm.reset();
    submitBtn.disabled = false;
  });
}

// Slow, looping "shop window" carousels (team and Google reviews). The
// track drifts on its own and loops forever (cards are cloned once so the
// end joins the start). It pauses while the visitor hovers, touches or
// focuses it; optional arrow buttons step one card at a time. No autoplay
// when the visitor prefers reduced motion.
function initCarousel(track, cardSelector, prevBtn, nextBtn) {
  const SPEED = 30; // px per second
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const originals = Array.from(track.querySelectorAll(cardSelector));
  if (originals.length < 2) return;

  originals.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach((img) => { img.alt = ''; });
    clone.querySelectorAll('a, button').forEach((el) => { el.tabIndex = -1; });
    track.appendChild(clone);
  });
  track.classList.add('is-carousel');

  const setWidth = () => track.children[originals.length].offsetLeft - originals[0].offsetLeft;
  const step = () => originals[1].offsetLeft - originals[0].offsetLeft;

  let pos = 0;
  let paused = false;
  let resumeTimer = null;
  let last = null;

  const wrap = () => {
    const w = setWidth();
    if (pos >= w) pos -= w;
    if (pos < 0) pos += w;
  };

  const tick = (now) => {
    if (last !== null && !paused && !reduceMotion) {
      pos += SPEED * (now - last) / 1000;
      wrap();
      track.scrollLeft = pos;
    }
    last = now;
    requestAnimationFrame(tick);
  };

  const pause = () => {
    paused = true;
    clearTimeout(resumeTimer);
  };
  const resumeSoon = (delay = 2500) => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      pos = track.scrollLeft;
      wrap();
      paused = false;
    }, delay);
  };

  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', () => resumeSoon(800));
  track.addEventListener('touchstart', pause, { passive: true });
  track.addEventListener('touchend', () => resumeSoon(), { passive: true });
  track.addEventListener('focusin', pause);
  track.addEventListener('focusout', () => resumeSoon());
  track.addEventListener('scroll', () => {
    // Keep manual scrolling (wheel, swipe) inside the looped range too.
    if (!paused) return;
    const w = setWidth();
    if (track.scrollLeft >= w) track.scrollLeft -= w;
  }, { passive: true });

  const move = (dir) => {
    pause();
    pos = track.scrollLeft;
    if (dir < 0 && pos < step()) {
      pos += setWidth();
      track.scrollLeft = pos;
    }
    track.scrollBy({ left: dir * step(), behavior: 'smooth' });
    resumeSoon(4000);
  };
  if (prevBtn) prevBtn.addEventListener('click', () => move(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => move(1));

  requestAnimationFrame(tick);
}

const teamTrack = document.getElementById('team-track');
if (teamTrack) {
  initCarousel(teamTrack, '.team-card', document.getElementById('team-prev'), document.getElementById('team-next'));
}

const reviewsTrack = document.querySelector('.reviews-track');
if (reviewsTrack) {
  initCarousel(reviewsTrack, '.review-card', document.getElementById('reviews-prev'), document.getElementById('reviews-next'));
}
