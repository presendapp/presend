// GET  /api/maintainer-change-check?ecosystem=npm&package=lodash
// POST /api/maintainer-change-check  { "ecosystem": "npm", "packages": ["lodash", ...] }  (batch, max MAX_BATCH)
//
// Détecte un signal réel de risque de chaîne d'approvisionnement : un nouveau
// publieur qui prend le relais d'un paquet après une longue période de
// dormance -- le schéma exact de plusieurs attaques documentées (event-stream,
// ua-parser-js, colors.js). Distingue un publieur "nouveau" (jamais vu dans
// l'historique de ce paquet) d'un publieur "de retour" (déjà connu), pour
// éviter de signaler à tort les transitions légitimes entre mainteneurs établis.
//
// npm uniquement pour l'instant -- l'historique complet par version avec
// identité du publieur (_npmUser) est directement exposé par leur API en un
// seul appel. PyPI n'expose pas cette même granularité par version de la
// même façon, donc pas encore supporté ici plutôt que de construire quelque
// chose de moins fiable.

async function checkRateLimit(env, clientIP, bucket) {
  if (!env.PRESEND_ANALYTICS) return true;
  try {
    const now = Math.floor(Date.now() / 60000);
    const rateKey = `rate:${bucket}:${clientIP}:${now}`;
    let count = await env.PRESEND_ANALYTICS.get(rateKey);
    count = count ? parseInt(count) : 0;
    if (count >= 10) return false;
    if (Math.random() < 1 / 5) {
      await env.PRESEND_ANALYTICS.put(rateKey, (count + 5).toString(), { expirationTtl: 120 });
    }
  } catch (e) {
    return true;
  }
  return true;
}

function corsHeaders(extra = {}) {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', ...extra };
}

const DORMANCY_THRESHOLD_DAYS = 180;
// Seuls les événements récents rendent un paquet "suspicious" : sans fenêtre,
// 17 paquets sains sur 22 testés (react, express, lodash, debug, ms...) étaient
// signalés pour des passations légitimes datant parfois de 2013.
const RECENT_WINDOW_DAYS = 365;
// Publication par CI (trusted publishing OIDC, bots de release) : passer à la CI
// après une pause est typiquement une amélioration de sécurité, pas une prise de
// contrôle -- rapporté à part, sans déclencher "suspicious".
const CI_PUBLISHER_RE = /^github actions$|(^|[-_])(bot|ci|ops|release|deploys?|actions)([-_]|$)/i;

function isCiPublisher(name) {
  return CI_PUBLISHER_RE.test(name || '');
}

function analyzeNpm(data, now = Date.now()) {
  const currentMaintainers = (data.maintainers || []).map((m) => m.name);

  const timeEntries = Object.entries(data.time || {})
    .filter(([v]) => v !== 'created' && v !== 'modified')
    .map(([version, publishedAt]) => {
      const npmUser = data.versions?.[version]?._npmUser?.name || null;
      return { version, publishedAt: new Date(publishedAt), publisher: npmUser };
    })
    .filter((v) => v.publisher && v.publishedAt.getTime() <= now)
    .sort((a, b) => a.publishedAt - b.publishedAt);

  if (timeEntries.length === 0) {
    return { error: 'No publish history with publisher info available for this package.' };
  }

  const seenPublishers = new Set();
  const flaggedEvents = [];
  const ciEvents = [];
  const prereleaseEvents = [];
  let historicalCount = 0;
  const windowStart = now - RECENT_WINDOW_DAYS * 86400000;

  for (let i = 0; i < timeEntries.length; i++) {
    const entry = timeEntries[i];
    const isNewPublisher = !seenPublishers.has(entry.publisher);
    seenPublishers.add(entry.publisher);
    if (i === 0 || !isNewPublisher) continue;

    const prev = timeEntries[i - 1];
    const gapDays = Math.round((entry.publishedAt - prev.publishedAt) / 86400000);
    if (gapDays < DORMANCY_THRESHOLD_DAYS) continue;

    const event = {
      version: entry.version,
      publisher: entry.publisher,
      published: entry.publishedAt.toISOString().slice(0, 10),
      previous_publisher: prev.publisher,
      dormancy_days: gapDays,
    };
    if (entry.publishedAt.getTime() < windowStart) {
      historicalCount++;
    } else if (entry.version.includes('-')) {
      // Pré-version semver : jamais résolue par une plage classique (^x.y.z),
      // donc hors du chemin d'installation par défaut -- visible, pas "suspicious".
      prereleaseEvents.push({ ...event, reason: 'New publisher on a pre-release version (not installed by default semver ranges).' });
    } else if (isCiPublisher(entry.publisher)) {
      ciEvents.push({ ...event, reason: 'Publishing moved to a CI/automation identity after inactivity (often trusted publishing adoption).' });
    } else {
      flaggedEvents.push({ ...event, reason: 'New publisher took over after a long period of inactivity.' });
    }
  }

  const latest = timeEntries[timeEntries.length - 1];

  return {
    current_maintainers: currentMaintainers,
    total_distinct_publishers: seenPublishers.size,
    latest_version: { version: latest.version, publisher: latest.publisher, published: latest.publishedAt.toISOString().slice(0, 10) },
    suspicious: flaggedEvents.length > 0,
    flagged_events: flaggedEvents,
    ci_publisher_events: ciEvents,
    prerelease_events: prereleaseEvents,
    historical_events_count: historicalCount,
    recent_window_days: RECENT_WINDOW_DAYS,
    note: `Flags a previously unseen human publisher taking over after ${DORMANCY_THRESHOLD_DAYS}+ days of inactivity, within the last ${RECENT_WINDOW_DAYS} days. Heuristic signal for manual review, not proof of compromise. Does not detect a hijacked existing account or a malicious release by an existing maintainer.`,
  };
}

const MAX_BATCH = 20;
// Cloudflare limite à 6 le nombre de connexions sortantes simultanées par invocation.
const FETCH_CONCURRENCY = 6;
const FETCH_TIMEOUT_MS = 8000;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(obj, status = 200, extra = {}, pretty = false) {
  return new Response(JSON.stringify(obj, null, pretty ? 2 : 0), { status, headers: { ...JSON_HEADERS, ...corsHeaders(), ...extra } });
}

// Le timeout couvre toute la réponse, corps compris (certains documents du
// registre dépassent 15 Mo) -- et pas seulement la réception des en-têtes.
async function checkPackage(pkg) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, { signal: controller.signal });
    if (res.status === 404) return { status: 200, body: { package: pkg, found: false, note: 'Package not found on npm.' } };
    if (!res.ok) return { status: 502, body: { package: pkg, error: `npm registry error (HTTP ${res.status})` } };
    const data = await res.json();
    return { status: 200, body: { package: pkg, ecosystem: 'npm', found: true, ...analyzeNpm(data) } };
  } catch (e) {
    if (e.name === 'AbortError') return { status: 504, body: { package: pkg, error: 'npm registry request timed out. Try again shortly.' } };
    return { status: 502, body: { package: pkg, error: 'Could not complete maintainer change check.', detail: e.message } };
  } finally {
    clearTimeout(timeout);
  }
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP, 'maintainerchangecheck');
  if (!allowed) return jsonResponse({ error: 'Rate limit exceeded. Max 10 requests per minute.' }, 429);

  const { searchParams } = new URL(request.url);
  const ecosystem = (searchParams.get('ecosystem') || '').toLowerCase();
  const pkg = (searchParams.get('package') || '').trim();

  if (!ecosystem || !pkg) {
    return jsonResponse({
      usage: 'GET /api/maintainer-change-check?ecosystem=npm&package=lodash',
      batch_usage: `POST /api/maintainer-change-check with {"ecosystem":"npm","packages":["lodash","express"]} (max ${MAX_BATCH} packages, counts as one request)`,
      note: `Flags a previously unseen human publisher taking over a package after ${DORMANCY_THRESHOLD_DAYS}+ days of inactivity, within the last ${RECENT_WINDOW_DAYS} days (the event-stream pattern). Does not detect a hijacked existing account or a malicious release by an existing maintainer. Currently npm only.`,
      supported_ecosystems: ['npm'],
    }, 200, {}, true);
  }
  if (ecosystem !== 'npm') return jsonResponse({ error: `Ecosystem "${ecosystem}" is not yet supported. Currently supported: npm.` }, 400);

  const { status, body } = await checkPackage(pkg);
  return jsonResponse(body, status, status === 200 ? { 'Cache-Control': 'public, max-age=3600' } : {}, true);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP, 'maintainerchangecheck');
  if (!allowed) return jsonResponse({ error: 'Rate limit exceeded. Max 10 requests per minute.' }, 429);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const usage = `Send {"ecosystem":"npm","packages":["name", ...]} (max ${MAX_BATCH} packages).`;
  const ecosystem = typeof body?.ecosystem === 'string' ? body.ecosystem.trim().toLowerCase() : '';
  if (ecosystem !== 'npm') return jsonResponse({ error: 'Missing or unsupported ecosystem. Currently supported: npm.', usage }, 400);
  const packages = Array.isArray(body?.packages) ? body.packages : null;
  if (!packages || packages.length === 0) return jsonResponse({ error: 'Missing or empty "packages" array.', usage }, 400);
  if (packages.length > MAX_BATCH) return jsonResponse({ error: `Too many packages: ${packages.length} (max ${MAX_BATCH} per request).`, usage }, 400);

  const results = await mapPool(packages, FETCH_CONCURRENCY, async (raw) => {
    const pkg = typeof raw === 'string' ? raw.trim() : '';
    // 214 = longueur max d'un nom de paquet npm.
    if (!pkg || pkg.length > 214) return { package: raw, error: 'Invalid package name.' };
    return (await checkPackage(pkg)).body;
  });

  return jsonResponse({
    ecosystem: 'npm',
    count: results.length,
    suspicious_count: results.filter((r) => r.suspicious).length,
    error_count: results.filter((r) => r.error).length,
    results,
    recent_window_days: RECENT_WINDOW_DAYS,
  }, 200, { 'Cache-Control': 'no-store' });
}
