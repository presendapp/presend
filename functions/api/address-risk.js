// GET /api/address-risk?address=0x...
//
// Checks a crypto address against the OFAC Specially Designated
// Nationals (SDN) list -- the US Treasury's sanctions list, which since
// 2018 has included digital currency addresses. Covers EVM-format
// addresses (Ethereum, BSC, Arbitrum, and any other EVM chain reusing
// the same 0x... address, since the format -- and often the address
// itself -- is shared across chains).
//
// Source: the community-maintained 0xB10C/ofac-sanctioned-digital-currency-addresses
// repo, which extracts and republishes OFAC's SDN list as plain per-asset
// text files, regenerated nightly from the official sdn_advanced.xml.
// Free, no signup, no key -- same "no-friction" gap ip-reputation fills
// for Spamhaus DROP.
//
// Cosmos SDK (bech32) addresses are format-detected but not yet checked
// against a sanctions source -- OFAC has not published SDN entries in
// bech32 format as of this writing, so an honest "not covered" beats a
// false sense of clean.
//
// Complements ip-reputation and url-reputation -- same "verify before
// you trust it" family, this time for on-chain addresses.

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

  try {
    if (Math.random() < 0.1) {
      const today = new Date().toISOString().split('T')[0];
      const visitKey = `api-visits:address-risk:${today}`;
      const visits = await env.PRESEND_ANALYTICS.get(visitKey);
      await env.PRESEND_ANALYTICS.put(visitKey, ((visits ? parseInt(visits) : 0) + 10).toString());
    }
  } catch (e) { /* tracking best-effort */ }

  return true;
}

function corsHeaders(extra = {}) {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', ...extra };
}

const EVM_RE = /^0x[0-9a-fA-F]{40}$/;
// Loose bech32 shape check (human-readable prefix + '1' separator + data part).
// Not a full bech32 checksum validation -- just enough to classify the format.
const BECH32_RE = /^[a-z]{1,20}1[023456789ac-hj-np-z]{20,90}$/i;

function detectFormat(address) {
  if (EVM_RE.test(address)) return 'evm';
  if (BECH32_RE.test(address)) return 'cosmos-bech32';
  return 'unknown';
}

const EVM_LISTS = ['ETH', 'BSC', 'ARB'];
const LIST_BASE = 'https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists';

function parseAddressList(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && l.startsWith('0x'));
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP, 'address-risk');
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 10 requests per minute.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const { searchParams } = new URL(request.url);
  const address = (searchParams.get('address') || '').trim();

  if (!address) {
    return new Response(JSON.stringify({
      usage: 'GET /api/address-risk?address=0x...',
      note: 'Checks EVM-format addresses (Ethereum, BSC, Arbitrum, and other EVM chains) against the OFAC SDN sanctions list. Cosmos SDK (bech32) addresses are format-detected but not yet checked against a sanctions source.',
    }, null, 2), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const format = detectFormat(address);

  if (format === 'unknown') {
    return new Response(JSON.stringify({
      error: 'Unrecognized address format. Expected an EVM address (0x + 40 hex chars) or a Cosmos SDK bech32 address (e.g. cosmos1...).',
    }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  if (format === 'cosmos-bech32') {
    return new Response(JSON.stringify({
      address,
      format,
      sanctioned: null,
      note: 'Cosmos SDK (bech32) address format recognized, but no sanctions data source is wired up for this format yet. This is not a clean result -- it is an unchecked one.',
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const responses = await Promise.all(
      EVM_LISTS.map((ticker) =>
        fetch(`${LIST_BASE}/sanctioned_addresses_${ticker}.txt`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PresendBot/1.0; +https://presend.pages.dev)' },
          cf: { cacheTtl: 1800, cacheEverything: true },
        })
      )
    );
    clearTimeout(timeout);

    const failed = responses.find((r) => !r.ok);
    if (failed) throw new Error(`OFAC list fetch failed (HTTP ${failed.status})`);

    const texts = await Promise.all(responses.map((r) => r.text()));
    const allAddresses = texts.flatMap(parseAddressList);
    const addressLower = address.toLowerCase();
    const match = allAddresses.find((a) => a.toLowerCase() === addressLower);

    return new Response(JSON.stringify({
      address,
      format,
      sanctioned: !!match,
      lists_checked: EVM_LISTS,
      list_size: allAddresses.length,
      source: 'OFAC Specially Designated Nationals (SDN) list, digital currency addresses (ETH/BSC/ARB), republished nightly by 0xB10C/ofac-sanctioned-digital-currency-addresses from the official sdn_advanced.xml.',
      note: match
        ? 'This address appears on the OFAC SDN sanctions list. US persons are generally prohibited from dealing with it.'
        : 'Not on the checked OFAC SDN lists. This is one specific, US-government sanctions list -- not a full risk score, and a clean result here does not mean the address is otherwise trustworthy.',
    }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900', ...corsHeaders() } });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'OFAC list request timed out. Try again shortly.' }), {
        status: 504, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
    return new Response(JSON.stringify({ error: 'Could not complete address risk check.', detail: e.message }), {
      status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
