// Prints the slugs of posts whose publish time (Europe/Rome) has passed
// but whose page is not yet online. Used by the scheduled workflow to decide
// whether a new Netlify build is needed. Exits 0 always; empty output = nothing to do.
const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.SITE_URL || 'https://studiolegalefussone.com';
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'blog');

function romeNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
    if (kv) data[kv[1]] = kv[2];
  }
  return data;
}

(async () => {
  const now = romeNow();
  const due = fs.readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ slug: f.replace(/\.md$/, ''), ...frontmatter(path.join(CONTENT_DIR, f)) }))
    .filter((p) => p.date && `${p.date} ${p.time || '00:00'}` <= now);

  for (const p of due) {
    try {
      const res = await fetch(`${SITE_URL}/blog/${p.slug}.html`, { method: 'HEAD' });
      if (res.status === 404) console.log(p.slug);
    } catch (e) {
      console.error(`Controllo non riuscito per ${p.slug}: ${e.message}`);
    }
  }
})();
