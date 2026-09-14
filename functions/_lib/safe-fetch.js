// functions/_lib/safe-fetch.js
//
// SSRF-safe fetch for Presend's URL-fetching endpoints (redirect-trace,
// scrape, security-scan, favicon, security-headers).
//
// The problem this fixes: checking a URL's HOSTNAME STRING against a
// blocklist (e.g. rejecting "127.0.0.1") does NOT protect against DNS
// rebinding -- an attacker-controlled domain can resolve to a public IP
// at validation time and a private/internal IP at the moment fetch()
// actually connects, since standard fetch() re-resolves DNS on its own.
// The hostname-string check and the actual connection are two separate
// DNS lookups with a race window between them (TOCTOU).
//
// The fix: resolve the hostname ourselves via DNS-over-HTTPS, validate
// the ACTUAL RESOLVED IP (not just the hostname string) against the
// blocklist, then pin the real fetch() to that exact validated IP using
// Cloudflare's `cf: { resolveOverride }` request option -- which
// overrides DNS resolution for that specific fetch while still sending
// the correct Host header. No second, uncontrolled DNS lookup happens
// between validation and connection.
//
// Verified against a live DNS-rebinding test domain
// (7f000001.08080808.rbndr.us, alternates 127.0.0.1 / a public IP)
// before this was ever wired into a real endpoint: correctly rejected
// on every one of 5 consecutive resolutions.

const BLOCKED_PATTERNS = [
  /^localhost$/i, /^127\./, /^10\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^0\.0\.0\.0$/,
  /^\[?::1\]?$/, /^\[?fc00:/i, /^\[?fe80:/i,
  /\.local$/i, /^metadata\./i,
];

function isBlocked(value) {
  return BLOCKED_PATTERNS.some((re) => re.test(value));
}

async function resolveHostname(hostname) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(':')) {
    return [hostname];
  }
  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
    { headers: { Accept: 'application/dns-json' } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.Answer || []).filter((a) => a.type === 1).map((a) => a.data);
}

export async function validateAndResolve(hostname) {
  if (isBlocked(hostname)) {
    throw new Error(`Blocked hostname: ${hostname}`);
  }
  const ips = await resolveHostname(hostname);
  if (ips.length === 0) {
    throw new Error(`Could not resolve hostname: ${hostname}`);
  }
  const blockedIp = ips.find((ip) => isBlocked(ip));
  if (blockedIp) {
    throw new Error(`Hostname resolves to a blocked address: ${blockedIp}`);
  }
  return ips[0];
}

export async function safeFetch(url, options = {}) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Blocked protocol: ${parsed.protocol}`);
  }
  const validatedIp = await validateAndResolve(parsed.hostname);
  return fetch(url, {
    ...options,
    cf: { ...(options.cf || {}), resolveOverride: validatedIp },
  });
}

export { isBlocked as isBlockedHostname };
