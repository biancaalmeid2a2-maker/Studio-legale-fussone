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

// Contact form: no backend available, so we hand the request off via mailto
const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = new FormData(form);
  const nome = data.get('nome');
  const email = data.get('email');
  const telefono = data.get('telefono') || 'non indicato';
  const area = data.get('area') || 'non indicata';
  const messaggio = data.get('messaggio') || 'nessuna descrizione fornita';
  const preferenza = data.get('preferenza');

  const subject = `Richiesta di consulenza - ${nome}`;
  const body =
    `Nome e cognome: ${nome}\n` +
    `E-mail: ${email}\n` +
    `Telefono: ${telefono}\n` +
    `Area di interesse: ${area}\n` +
    `Preferenza di contatto: ${preferenza}\n\n` +
    `Descrizione della richiesta:\n${messaggio}`;

  const mailtoLink = `mailto:avvfussone@virgilio.it?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.location.href = mailtoLink;
  formStatus.textContent = 'Si aprirà il tuo programma di posta per completare l\'invio della richiesta.';
});
