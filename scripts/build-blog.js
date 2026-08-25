// Generates blog/*.html, the homepage "Dal blog" teaser and sitemap.xml
// from the markdown source files in content/blog/. Run via `npm run build`.
// This is the file the Netlify build runs after every git push (including
// commits made through the /admin editor), so a new post published there
// goes live without anyone touching code.
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const BLOG_DIR = path.join(ROOT, 'blog');
const INDEX_HTML = path.join(ROOT, 'index.html');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const SITE_URL = 'https://studiolegalefussone.com';

const SOCIAL_ICONS = `
        <a href="https://www.instagram.com/studiolegalefussone" target="_blank" rel="noopener" class="social-icon" aria-label="Instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.2" cy="6.8" r="1"></circle></svg>
        </a>
        <a href="https://www.facebook.com/profile.php?id=61564217236990" target="_blank" rel="noopener" class="social-icon" aria-label="Facebook">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 9V6.5c0-.83.67-1.5 1.5-1.5H17V2h-2.5A4.5 4.5 0 0 0 10 6.5V9H7v3h3v10h4V12h3.2l.8-3H14z"></path></svg>
        </a>
        <a href="https://wa.me/393713052304?text=Ciao%2C%20ho%20bisogno%20di%20una%20consulenza." target="_blank" rel="noopener" class="social-icon" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.28-1.38a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.19 8.19 0 0 1-1.26-4.35c0-4.53 3.69-8.22 8.23-8.22a8.18 8.18 0 0 1 8.22 8.22c0 4.53-3.69 8.22-8.2 8.22zm4.51-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12 .17 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z"/></svg>
        </a>`;

function header() {
  return `<header class="site-header" id="top">
  <div class="container header-inner">
    <a class="brand" href="../index.html#top">
      <img class="logo-icon" src="../assets/logo-icon.png" alt="" width="88" height="60">
      <span class="brand-text">
        <span class="brand-name">Studio Legale</span>
        <span class="brand-surname">Fussone</span>
      </span>
    </a>

    <nav class="main-nav" id="main-nav" aria-label="Navigazione principale">
      <ul>
        <li><a href="../index.html#studio">Lo Studio</a></li>
        <li><a href="../index.html#aree">Aree di attività</a></li>
        <li><a href="../index.html#metodo">Metodo</a></li>
        <li><a href="../index.html#avvocato">Avvocato</a></li>
        <li><a href="index.html">Blog</a></li>
        <li><a href="../index.html#contatti">Contatti</a></li>
      </ul>
    </nav>

    <div class="header-actions">
      <a href="../index.html#contatti" class="btn btn-on-dark btn-pill btn-small">Richiedi una consulenza</a>
      <button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Apri il menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <a class="brand" href="../index.html#top">
        <img class="logo-icon" src="../assets/logo-icon.png" alt="" width="88" height="60">
        <span class="brand-text">
          <span class="brand-name">Studio Legale</span>
          <span class="brand-surname">Fussone</span>
        </span>
      </a>
      <p>Avv. Giuseppe Fussone</p>
      <p>Via San Giovanni Bosco, 41 – 93017 San Cataldo (CL)</p>
      <p>P.IVA IT01178520860</p>
    </div>

    <div class="footer-col">
      <p class="footer-col-title">Contatti</p>
      <p><a href="tel:+390934587019">0934 587019</a></p>
      <p><a href="tel:+393713052304">371 305 2304</a></p>
      <p><a href="mailto:avvfussone@virgilio.it">avvfussone@virgilio.it</a></p>
      <p><a href="mailto:avvfussone@sicurezzapostale.it">PEC: avvfussone@sicurezzapostale.it</a></p>
      <p><a href="mailto:avvfussone@pec.virgilio.it">PEC: avvfussone@pec.virgilio.it</a></p>
      <p>Lun–Ven, 9:00–19:00</p>
    </div>

    <div class="footer-col">
      <p class="footer-col-title">Aree di attività</p>
      <p><a href="../index.html#aree">Diritto civile</a></p>
      <p><a href="../index.html#aree">Diritto di famiglia</a></p>
      <p><a href="../index.html#aree">Diritto penale</a></p>
      <p><a href="../index.html#aree">Diritto del lavoro</a></p>
      <p><a href="../index.html#aree">Altre aree &rarr;</a></p>
    </div>

    <div class="footer-col">
      <p class="footer-col-title">Social</p>
      <div class="social-links">${SOCIAL_ICONS}
      </div>
    </div>
  </div>
  <div class="container footer-bottom">
    <p>&copy; <span id="year"></span> Studio Legale Avv. Giuseppe Fussone. Tutti i diritti riservati. — <a href="index.html">Blog</a> — <a href="../privacy.html">Informativa sulla privacy</a></p>
  </div>
</footer>

<a class="whatsapp-fab" href="https://wa.me/393713052304?text=Ciao%2C%20ho%20bisogno%20di%20una%20consulenza." target="_blank" rel="noopener" aria-label="Scrivi allo Studio su WhatsApp">
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.28-1.38a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.19 8.19 0 0 1-1.26-4.35c0-4.53 3.69-8.22 8.23-8.22a8.18 8.18 0 0 1 8.22 8.22c0 4.53-3.69 8.22-8.2 8.22zm4.51-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12 .17 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z"/></svg>
</a>

<script src="../js/script.js"></script>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Minimal frontmatter parser: expects
// ---\nkey: value\n...\n---\nbody
function parsePost(raw, filename) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`File ${filename} non ha un frontmatter valido (--- ... ---)`);
  }
  const [, frontmatter, body] = match;
  const data = {};
  frontmatter.split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    value = value.replace(/^["']|["']$/g, '');
    data[key] = value;
  });
  data.slug = path.basename(filename, '.md');
  data.body = body.trim();
  return data;
}

function formatDateIt(isoDate) {
  const months = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function loadPosts() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parsePost(fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8'), f))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function renderArticlePage(post) {
  const bodyHtml = marked.parse(post.body);
  const dateIt = formatDateIt(post.date);
  const sourceBlock = post.source_url
    ? `\n    <p class="article-source">Fonte: <a href="${escapeHtml(post.source_url)}" target="_blank" rel="noopener">${escapeHtml(post.source_url)}</a></p>`
    : '';

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(post.title)} | Studio Legale Fussone</title>
<meta name="description" content="${escapeHtml(post.excerpt)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE_URL}/blog/${post.slug}.html">

<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(post.title)}">
<meta property="og:description" content="${escapeHtml(post.excerpt)}">
<meta property="og:locale" content="it_IT">

<link rel="icon" type="image/svg+xml" href="../favicon.svg">

<link rel="stylesheet" href="../css/fonts.css">
<link rel="stylesheet" href="../css/style.css">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": ${JSON.stringify(post.title)},
  "datePublished": "${post.date}",
  "dateModified": "${post.date}",
  "author": { "@type": "Organization", "name": "Studio Legale Avv. Giuseppe Fussone" },
  "publisher": { "@type": "Organization", "name": "Studio Legale Avv. Giuseppe Fussone" },
  "mainEntityOfPage": "${SITE_URL}/blog/${post.slug}.html"
}
</script>
</head>
<body>

<a class="skip-link" href="#main-content">Vai al contenuto principale</a>

${header()}

<main id="main-content">
  <article class="article">
    <a class="back-link" href="index.html">&larr; Torna al blog</a>
    <span class="article-tag">${escapeHtml(post.category)}</span>
    <p class="article-meta">${dateIt} &middot; a cura dello Studio Legale Fussone</p>
    <h1>${escapeHtml(post.title)}</h1>

    ${bodyHtml}
${sourceBlock}
    <div class="article-cta">
      <p>Hai bisogno di una valutazione sul tuo caso?</p>
      <a href="../index.html#contatti" class="btn btn-primary btn-pill">Richiedi una consulenza</a>
    </div>
  </article>
</main>

${footer()}
</body>
</html>
`;
}

function renderCard(post, linkPrefix) {
  return `        <article class="blog-card">
          <p class="blog-card-tag">${escapeHtml(post.category)}</p>
          <p class="blog-card-date">${formatDateIt(post.date)}</p>
          <h2><a href="${linkPrefix}${post.slug}.html">${escapeHtml(post.title)}</a></h2>
          <p class="excerpt">${escapeHtml(post.excerpt)}</p>
          <a class="blog-card-link" href="${linkPrefix}${post.slug}.html">Leggi l'articolo &rarr;</a>
        </article>`;
}

function renderBlogIndex(posts) {
  const cards = posts.map((p) => renderCard(p, '')).join('\n\n');
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog | Studio Legale Fussone</title>
<meta name="description" content="Approfondimenti e guide pratiche di diritto civile, penale, del lavoro e successorio a cura dello Studio Legale Fussone di San Cataldo.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE_URL}/blog/">

<meta property="og:type" content="website">
<meta property="og:title" content="Blog | Studio Legale Fussone">
<meta property="og:description" content="Approfondimenti e guide pratiche di diritto civile, penale, del lavoro e successorio a cura dello Studio Legale Fussone di San Cataldo.">
<meta property="og:locale" content="it_IT">

<link rel="icon" type="image/svg+xml" href="../favicon.svg">

<link rel="stylesheet" href="../css/fonts.css">
<link rel="stylesheet" href="../css/style.css">
</head>
<body>

<a class="skip-link" href="#main-content">Vai al contenuto principale</a>

${header()}

<main id="main-content">

  <section class="page-hero">
    <div class="container">
      <p class="eyebrow">Blog dello Studio</p>
      <h1>Approfondimenti e guide pratiche</h1>
      <p>Informazioni chiare su diritto civile, penale, del lavoro e successorio, a cura dello Studio Legale Fussone.</p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="blog-grid">
${cards}
      </div>
      <p class="blog-empty-note">Nuovi approfondimenti pubblicati regolarmente. Torna a trovarci presto.</p>
    </div>
  </section>

</main>

${footer()}
</body>
</html>
`;
}

function updateHomepageTeaser(posts) {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const latest = posts[0];
  if (!latest) return;
  const card = renderCard(latest, 'blog/');
  const startMarker = '<!-- BLOG-TEASER-START (generato automaticamente da scripts/build-blog.js, non modificare a mano) -->';
  const endMarker = '<!-- BLOG-TEASER-END -->';
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    console.warn('Marcatori BLOG-TEASER non trovati in index.html, salto l\'aggiornamento della home.');
    return;
  }
  const before = html.slice(0, startIdx + startMarker.length);
  const after = html.slice(endIdx);
  const updated = `${before}\n${card}\n        ${after}`;
  fs.writeFileSync(INDEX_HTML, updated);
}

function updateSitemap(posts) {
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/blog/`,
    ...posts.map((p) => `${SITE_URL}/blog/${p.slug}.html`),
    `${SITE_URL}/privacy.html`,
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url>\n    <loc>${u}</loc>\n  </url>`)
    .join('\n')}\n</urlset>\n`;
  fs.writeFileSync(SITEMAP, xml);
}

function main() {
  const posts = loadPosts();
  if (posts.length === 0) {
    console.warn('Nessun post trovato in content/blog, salto la generazione.');
    return;
  }
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

  posts.forEach((post) => {
    fs.writeFileSync(path.join(BLOG_DIR, `${post.slug}.html`), renderArticlePage(post));
  });
  fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), renderBlogIndex(posts));
  updateHomepageTeaser(posts);
  updateSitemap(posts);

  console.log(`Generati ${posts.length} articoli, blog/index.html, homepage e sitemap.xml.`);
}

main();
