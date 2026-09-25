// GET /api/ip-reputation?ip=1.2.3.4
//
// Checks an IPv4 address against Spamhaus DROP (Don't Route Or
// Peer) -- a free, public, no-signup, no-key list of netblocks
// known to be entirely controlled by spammers or hijacked for
// malicious use. Used by ISPs and firewalls worldwide.
//
// Every dedicated "IP reputation/abuse check" service we could find
// (AbuseIPDB, Abstract, Opportify, FraudLogix, IPQualityScore) gates
// even its free tier behind account signup and an API key -- this
// fills that specific gap: a genuinely no-friction, no-signup check,
// even though it covers a narrower signal (known spam/hijacked
// netblocks) than those paid aggregators.
//
// Complements url-reputation (malware/phishing URLs) and
// ai-crawler-check (bot identity vs policy) -- same "verify before
// you trust it" family, this time for the IP itself.

async function checkRateLimit(env, clientIP, bucket) {
  if (!env.PRESEND_ANALYTICS) return true;
  try {
    const now = Math.floor(Date.now() / 60000);
    const rateKey = `rate:${bucket}:${clientIP}:${now}`;
    let count = await env.PRESEND_ANALYTICS.get(rateKey);
    count = count ? parseInt(count) : 0;
    if (count >= 10) return false;
    // Écriture échantillonnée (1 sur 5) pour économiser le quota KV --
    // légèrement moins précis en rafale, mais protège toujours contre un abus soutenu.
    if (Math.random() < 1 / 5) {
      await env.PRESEND_ANALYTICS.put(rateKey, (count + 5).toString(), { expirationTtl: 120 });
    }
  } catch (e) {
    // KV en panne ou quota dépassé -- ne doit jamais faire planter la requête.
    return true;
  }
  return true;
}

function corsHeaders(extra = {}) {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', ...extra };
}

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function ipToInt(ip) {
  const m = ip.match(IPV4_RE);
  if (!m) return null;
  const parts = m.slice(1, 5).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function ipInCidr(ipInt, rangeInt, bits) {
  if (bits === 0) return true;
  const mask = (~0 << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

// ---- Copie de la liste DROP -------------------------------------------------
// Conditions Spamhaus (FAQ DROP) : téléchargements automatisés espacés d'au
// moins une heure (une fois par jour suffit), sous peine de blocage de l'IP ;
// la date et le copyright doivent accompagner les données. L'ancienne version
// téléchargeait drop.txt avec un cache Cloudflare de 30 min PROPRE À CHAQUE
// datacenter -- soit potentiellement des dizaines de téléchargements par heure.
// Désormais : une copie globale dans KV, rafraîchie au plus toutes les 12 h,
// avec un verrou KV d'une heure pour qu'un seul datacenter télécharge.
const DROP_V4_URL = 'https://www.spamhaus.org/drop/drop_v4.json';
const KV_DATA_KEY = 'spamhaus-drop:v4';
const KV_LOCK_KEY = 'spamhaus-drop:v4:lock';
const REFRESH_AFTER_MS = 12 * 3600 * 1000;
const LOCK_TTL_S = 3600;
const MEMORY_TTL_MS = 5 * 60 * 1000;
const STALE_AFTER_MS = 36 * 3600 * 1000;

let memo = null; // { loadedAt, data, entries } -- cache par instance

function parseDropJson(text) {
  const records = [];
  let meta = null;
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    let obj;
    try { obj = JSON.parse(t); } catch (e) { continue; }
    if (obj.type === 'metadata') { meta = obj; continue; }
    if (typeof obj.cidr === 'string') records.push([obj.cidr, obj.sblid || null]);
  }
  // Une réponse "200" sans métadonnées ni entrées n'est pas une liste vide
  // valide : on refuse plutôt que de répondre "non listé" sur zéro donnée.
  if (!meta || records.length === 0) throw new Error('Unexpected DROP JSON format');
  return { records, timestamp: meta.timestamp || null, copyright: meta.copyright || null, terms: meta.terms || null };
}

function toEntries(records) {
  const out = [];
  for (const [cidr, sbl] of records) {
    const [range, bitsStr] = cidr.split('/');
    const rangeInt = ipToInt(range);
    const bits = parseInt(bitsStr, 10);
    if (rangeInt === null || isNaN(bits) || bits < 0 || bits > 32) continue;
    out.push({ cidr, rangeInt, bits, sbl });
  }
  return out;
}

async function downloadDrop() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(DROP_V4_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PresendBot/1.0; +https://presend.pages.dev)' },
    });
    if (!res.ok) throw new Error(`Spamhaus DROP fetch failed (HTTP ${res.status})`);
    return { ...parseDropJson(await res.text()), fetched_at: Date.now() };
  } finally {
    clearTimeout(timeout);
  }
}

async function loadDrop(env) {
  const now = Date.now();
  if (memo && now - memo.loadedAt < MEMORY_TTL_MS) return memo;
  const kv = env.PRESEND_ANALYTICS;

  let data = memo ? memo.data : null;
  if (kv) {
    try { const d = await kv.get(KV_DATA_KEY, 'json'); if (d) data = d; } catch (e) { /* KV indisponible */ }
  }

  if (!data || now - data.fetched_at > REFRESH_AFTER_MS) {
    let mayFetch = true;
    if (kv) {
      try {
        if (await kv.get(KV_LOCK_KEY)) mayFetch = false;
        else await kv.put(KV_LOCK_KEY, String(now), { expirationTtl: LOCK_TTL_S });
      } catch (e) {
        mayFetch = !data; // pas de verrou possible : ne télécharger que si on n'a rien
      }
    }
    if (mayFetch) {
      try {
        const fresh = await downloadDrop();
        data = fresh;
        if (kv) { try { await kv.put(KV_DATA_KEY, JSON.stringify(fresh)); } catch (e) { /* best-effort */ } }
      } catch (e) {
        if (!data) throw e; // aucune copie de secours
      }
    }
  }

  if (!data) throw new Error('DROP list not available yet (a refresh is in progress). Try again in a minute.');
  memo = { loadedAt: now, data, entries: toEntries(data.records) };
  return memo;
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP, 'ip-reputation');
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 10 requests per minute.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const { searchParams } = new URL(request.url);
  const ip = (searchParams.get('ip') || '').trim();

  if (!ip) {
    return new Response(JSON.stringify({
      usage: 'GET /api/ip-reputation?ip=1.2.3.4',
      note: 'Checks against Spamhaus DROP (known spam/hijacked netblocks). IPv4 only. A clean result means not on this specific list, not a full-spectrum safety guarantee.',
    }, null, 2), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const ipInt = ipToInt(ip);
  if (ipInt === null) {
    return new Response(JSON.stringify({ error: 'Invalid or unsupported IP format. IPv4 only, e.g. 1.2.3.4.' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  let drop;
  try {
    drop = await loadDrop(env);
  } catch (e) {
    const timedOut = e.name === 'AbortError';
    return new Response(JSON.stringify({
      error: timedOut ? 'Spamhaus DROP request timed out. Try again shortly.' : 'DROP list temporarily unavailable.',
      detail: timedOut ? undefined : e.message,
    }), { status: timedOut ? 504 : 503, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const match = drop.entries.find((e) => ipInCidr(ipInt, e.rangeInt, e.bits));
  const ageMs = Date.now() - drop.data.fetched_at;

  return new Response(JSON.stringify({
    ip,
    listed: !!match,
    matched_range: match ? match.cidr : null,
    reference: match ? match.sbl : null,
    list_size: drop.entries.length,
    list_date: drop.data.timestamp ? new Date(drop.data.timestamp * 1000).toISOString().slice(0, 10) : null,
    data_age_hours: Math.round(ageMs / 360000) / 10,
    stale: ageMs > STALE_AFTER_MS,
    source: 'Spamhaus DROP (Don\'t Route Or Peer) -- netblocks known to be hijacked or controlled by spam/cyber-crime operations. IPv4 only. Spamhaus re-evaluates listings daily; this service refreshes its copy at most every 12 hours.',
    attribution: drop.data.copyright,
    terms: drop.data.terms,
    note: match
      ? 'This IP falls within a netblock Spamhaus lists as hijacked or controlled by spam/cyber-crime operations.'
      : 'Not on Spamhaus DROP. This is one specific list, not a full reputation score -- a clean result does not guarantee the IP is safe.',
  }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900', ...corsHeaders() } });
}
