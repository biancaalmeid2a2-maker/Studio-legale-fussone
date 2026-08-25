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

// Google Maps embed: load only after consent, since it can set third-party
// cookies. Consent is remembered in localStorage (not a cookie).
const mapEmbed = document.getElementById('map-embed');
const mapConsentAccept = document.getElementById('map-consent-accept');
const cookieBanner = document.getElementById('cookie-banner');
const cookieAccept = document.getElementById('cookie-accept');
const cookieReject = document.getElementById('cookie-reject');
const MAP_SRC = 'https://www.google.com/maps?q=Via+San+Giovanni+Bosco+41+93017+San+Cataldo+CL&output=embed';

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

if (mapEmbed) {
  let storedConsent = null;
  try { storedConsent = localStorage.getItem('cookie-consent'); } catch (err) {}

  if (storedConsent === 'accepted') {
    loadMap();
  } else if (storedConsent !== 'rejected' && cookieBanner) {
    cookieBanner.hidden = false;
    document.body.classList.add('cookie-banner-visible');
  }

  if (mapConsentAccept) {
    mapConsentAccept.addEventListener('click', () => {
      loadMap();
      try { localStorage.setItem('cookie-consent', 'accepted'); } catch (err) {}
      if (cookieBanner) cookieBanner.hidden = true;
      document.body.classList.remove('cookie-banner-visible');
    });
  }
  if (cookieAccept) {
    cookieAccept.addEventListener('click', () => {
      loadMap();
      try { localStorage.setItem('cookie-consent', 'accepted'); } catch (err) {}
      cookieBanner.hidden = true;
      document.body.classList.remove('cookie-banner-visible');
    });
  }
  if (cookieReject) {
    cookieReject.addEventListener('click', () => {
      try { localStorage.setItem('cookie-consent', 'rejected'); } catch (err) {}
      cookieBanner.hidden = true;
      document.body.classList.remove('cookie-banner-visible');
    });
  }
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
