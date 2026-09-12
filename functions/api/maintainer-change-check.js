// GET /api/maintainer-change-check?ecosystem=npm&package=lodash
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
    if (Math.random() < 1 / 3) {
      await env.PRESEND_ANALYTICS.put(rateKey, (count + 3).toString(), { expirationTtl: 120 });
    }
  } catch (e) {
    return true;
  }
  return true;
}

function corsHeaders(extra = {}) {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', ...extra };
}

const DORMANCY_THRESHOLD_DAYS = 180;

function analyzeNpm(data) {
  const currentMaintainers = (data.maintainers || []).map((m) => m.name);

  const timeEntries = Object.entries(data.time || {})
    .filter(([v]) => v !== 'created' && v !== 'modified')
    .map(([version, publishedAt]) => {
      const npmUser = data.versions?.[version]?._npmUser?.name || null;
      return { version, publishedAt: new Date(publishedAt), publisher: npmUser };
    })
    .filter((v) => v.publisher)
    .sort((a, b) => a.publishedAt - b.publishedAt);

  if (timeEntries.length === 0) {
    return { error: 'No publish history with publisher info available for this package.' };
  }

  const seenPublishers = new Set();
  const flaggedEvents = [];

  for (let i = 0; i < timeEntries.length; i++) {
    const entry = timeEntries[i];
    const isNewPublisher = !seenPublishers.has(entry.publisher);
    seenPublishers.add(entry.publisher);

    if (i > 0 && isNewPublisher) {
      const prev = timeEntries[i - 1];
      const gapDays = Math.round((entry.publishedAt - prev.publishedAt) / 86400000);
      if (gapDays >= DORMANCY_THRESHOLD_DAYS) {
        flaggedEvents.push({
          version: entry.version,
          publisher: entry.publisher,
          published: entry.publishedAt.toISOString().slice(0, 10),
          previous_publisher: prev.publisher,
          dormancy_days: gapDays,
          reason: 'New publisher took over after a long period of inactivity.',
        });
      }
    }
  }

  const latest = timeEntries[timeEntries.length - 1];

  return {
    current_maintainers: currentMaintainers,
    total_distinct_publishers: seenPublishers.size,
    latest_version: { version: latest.version, publisher: latest.publisher, published: latest.publishedAt.toISOString().slice(0, 10) },
    suspicious: flaggedEvents.length > 0,
    flagged_events: flaggedEvents,
    note: 'Heuristic signal for manual review, not proof of compromise. A flagged event can be a legitimate maintainer handoff.',
  };
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP, 'maintainerchangecheck');
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 10 requests per minute.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const { searchParams } = new URL(request.url);
  const ecosystem = (searchParams.get('ecosystem') || '').toLowerCase();
  const pkg = (searchParams.get('package') || '').trim();

  if (!ecosystem || !pkg) {
    return new Response(JSON.stringify({
      usage: 'GET /api/maintainer-change-check?ecosystem=npm&package=lodash',
      note: 'Flags a new package publisher appearing after a long period of dormancy -- a documented supply-chain attack pattern (event-stream, ua-parser-js, colors.js). Currently npm only.',
      supported_ecosystems: ['npm'],
    }, null, 2), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  if (ecosystem !== 'npm') {
    return new Response(JSON.stringify({
      error: `Ecosystem "${ecosystem}" is not yet supported. Currently supported: npm.`,
    }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.status === 404) {
      return new Response(JSON.stringify({ package: pkg, found: false, note: 'Package not found on npm.' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
    if (!res.ok) throw new Error(`npm registry error (HTTP ${res.status})`);

    const data = await res.json();
    const analysis = analyzeNpm(data);

    return new Response(JSON.stringify({ package: pkg, ecosystem: 'npm', found: true, ...analysis }, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders() },
    });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'npm registry request timed out. Try again shortly.' }), {
        status: 504, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
    return new Response(JSON.stringify({ error: 'Could not complete maintainer change check.', detail: e.message }), {
      status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
