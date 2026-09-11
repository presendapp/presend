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
  const now = Math.floor(Date.now() / 60000);
  const rateKey = `rate:${bucket}:${clientIP}:${now}`;
  let count = await env.PRESEND_ANALYTICS.get(rateKey);
  count = count ? parseInt(count) : 0;
  if (count >= 10) return false;
  await env.PRESEND_ANALYTICS.put(rateKey, (count + 1).toString(), { expirationTtl: 120 });
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

function parseDropList(text) {
  const entries = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';')) continue;
    const [cidr, , sbl] = trimmed.split(/\s*;\s*/);
    if (!cidr || !cidr.includes('/')) continue;
    const [range, bitsStr] = cidr.split('/');
    const rangeInt = ipToInt(range);
    const bits = parseInt(bitsStr, 10);
    if (rangeInt === null || isNaN(bits)) continue;
    entries.push({ cidr, rangeInt, bits, sbl: sbl || null });
  }
  return entries;
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch('https://www.spamhaus.org/drop/drop.txt', {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PresendBot/1.0; +https://presend.pages.dev)' },
      cf: { cacheTtl: 1800, cacheEverything: true },
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Spamhaus DROP fetch failed (HTTP ${res.status})`);

    const text = await res.text();
    const entries = parseDropList(text);
    const match = entries.find((e) => ipInCidr(ipInt, e.rangeInt, e.bits));

    return new Response(JSON.stringify({
      ip,
      listed: !!match,
      matched_range: match ? match.cidr : null,
      reference: match ? match.sbl : null,
      list_size: entries.length,
      source: 'Spamhaus DROP (Don\'t Route Or Peer) -- netblocks known to be entirely spam/hijacker-controlled. IPv4 only, updated roughly hourly.',
      note: match
        ? 'This IP falls within a netblock Spamhaus lists as entirely controlled by spammers or hijackers.'
        : 'Not on Spamhaus DROP. This is one specific list, not a full reputation score -- a clean result does not guarantee the IP is safe.',
    }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900', ...corsHeaders() } });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Spamhaus DROP request timed out. Try again shortly.' }), {
        status: 504, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
    return new Response(JSON.stringify({ error: 'Could not complete IP reputation check.', detail: e.message }), {
      status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
