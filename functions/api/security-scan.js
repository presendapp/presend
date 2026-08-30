// GET /api/security-scan?url=https://example.com
//
// Aggregates 3 existing checks into a single security posture report:
// HTTP security headers, malware/phishing reputation (URLhaus), and
// passive attack-surface visibility (subdomains via crt.sh).
//
// Combines them once instead of requiring 3 separate calls -- same
// chaining philosophy as merge-and-compress-pdf, clean-image, and
// email-verify.

import { checkReputation } from '../_shared/url-reputation-check.js';

async function checkRateLimit(env, clientIP, bucket) {
  if (!env.PRESEND_ANALYTICS) return true;
  const now = Math.floor(Date.now() / 60000);
  const rateKey = `rate:${bucket}:${clientIP}:${now}`;
  let count = await env.PRESEND_ANALYTICS.get(rateKey);
  count = count ? parseInt(count) : 0;
  if (count >= 10) return false; // le plus coûteux des endpoints (3 appels externes), quota conservateur
  await env.PRESEND_ANALYTICS.put(rateKey, (count + 1).toString(), { expirationTtl: 120 });

  try {
    if (Math.random() < 0.1) {
      const today = new Date().toISOString().split('T')[0];
      const visitKey = `api-visits:${bucket}:${today}`;
      const visits = await env.PRESEND_ANALYTICS.get(visitKey);
      await env.PRESEND_ANALYTICS.put(visitKey, ((visits ? parseInt(visits) : 0) + 10).toString());
    }
  } catch (e) { /* tracking best-effort */ }

  return true;
}

function corsHeaders(extra = {}) {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', ...extra };
}

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i, /^127\./, /^10\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^0\.0\.0\.0$/,
  /^\[?::1\]?$/, /^\[?fc00:/i, /^\[?fe80:/i,
  /\.local$/i, /^metadata\./i,
];
function isBlockedHostname(hostname) {
  return BLOCKED_HOSTNAME_PATTERNS.some((re) => re.test(hostname));
}

const HEADER_CHECKS = [
  { header: 'strict-transport-security', weight: 20, label: 'HSTS', advice: 'Add Strict-Transport-Security to force HTTPS and prevent downgrade attacks.' },
  { header: 'content-security-policy', weight: 25, label: 'Content-Security-Policy', advice: 'Add a Content-Security-Policy to mitigate XSS and data injection attacks.' },
  { header: 'x-content-type-options', weight: 10, label: 'X-Content-Type-Options', advice: 'Add X-Content-Type-Options: nosniff to prevent MIME-sniffing attacks.', expected: 'nosniff' },
  { header: 'x-frame-options', weight: 15, label: 'X-Frame-Options', advice: 'Add X-Frame-Options (or frame-ancestors in CSP) to prevent clickjacking.' },
  { header: 'referrer-policy', weight: 10, label: 'Referrer-Policy', advice: 'Add a Referrer-Policy to control how much referrer data leaks to other sites.' },
  { header: 'permissions-policy', weight: 10, label: 'Permissions-Policy', advice: 'Add a Permissions-Policy to restrict access to browser features (camera, geolocation, etc.).' },
  { header: 'x-xss-protection', weight: 5, label: 'X-XSS-Protection', advice: 'Legacy header, low impact on modern browsers, but cheap to add.' },
  { header: 'cross-origin-opener-policy', weight: 5, label: 'Cross-Origin-Opener-Policy', advice: 'Add Cross-Origin-Opener-Policy to isolate your browsing context from cross-origin windows.' },
];

function grade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

// --- Check 1: HTTP security headers ---
async function checkHeaders(targetUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PresendBot/1.0; +https://presend.pages.dev)' },
    });
    clearTimeout(timeout);

    const finalUrl = new URL(res.url);
    if (isBlockedHostname(finalUrl.hostname)) {
      return { checked: false, error: 'Disallowed domain after redirect' };
    }

    let score = 0;
    let maxScore = 0;
    const results = [];
    for (const check of HEADER_CHECKS) {
      maxScore += check.weight;
      const value = res.headers.get(check.header);
      const present = !!value;
      const valid = present && (!check.expected || value.toLowerCase().includes(check.expected));
      if (valid) score += check.weight;
      results.push({
        header: check.label, present, value: value || null,
        points: valid ? check.weight : 0, max_points: check.weight,
        advice: valid ? null : check.advice,
      });
    }
    const percentage = Math.round((score / maxScore) * 100);
    return { checked: true, score: percentage, grade: grade(percentage), checks: results };
  } catch (e) {
    clearTimeout(timeout);
    return { checked: false, error: e.name === 'AbortError' ? 'Request timed out' : e.message };
  }
}

// --- Check 3: attack surface (subdomains via crt.sh) ---
async function checkAttackSurface(domain) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`https://crt.sh/?q=${encodeURIComponent('%.' + domain)}&output=json`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PresendBot/1.0; +https://presend.pages.dev)' },
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`crt.sh error: HTTP ${res.status}`);
    const data = await res.json();

    const subdomains = new Set();
    for (const entry of data) {
      const names = String(entry.name_value || '').split('\n');
      for (const n of names) {
        const clean = n.trim().toLowerCase().replace(/^\*\./, '');
        if (clean.endsWith('.' + domain) || clean === domain) subdomains.add(clean);
      }
    }
    const sorted = Array.from(subdomains).sort();
    return { checked: true, count: sorted.length, subdomains: sorted.slice(0, 100) };
  } catch (e) {
    clearTimeout(timeout);
    return { checked: false, count: null, error: e.name === 'AbortError' ? 'crt.sh request timed out' : e.message };
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

  const allowed = await checkRateLimit(env, clientIP, 'securityscan');
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 10 requests per minute.' }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({
      usage: 'GET /api/security-scan?url=https://example.com',
      note: 'Combines security-headers + url-reputation + subdomains into one report. Same result as calling all three separately, in a single call.',
    }, null, 2), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('bad protocol');
    if (isBlockedHostname(parsedUrl.hostname)) throw new Error('blocked hostname');
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid or disallowed URL' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const domain = parsedUrl.hostname;

  const [headersResult, reputationResult, surfaceResult] = await Promise.all([
    checkHeaders(targetUrl),
    checkReputation(targetUrl, env),
    checkAttackSurface(domain),
  ]);

  // Overall score: starts from the headers score (0 if that check failed),
  // then a confirmed malicious listing overrides everything -- an active
  // malware/phishing flag matters more than any header configuration.
  let overallScore = headersResult.checked ? headersResult.score : 0;
  let verdict = 'No major issues found.';

  if (reputationResult.malicious === true) {
    overallScore = Math.min(overallScore, 10);
    verdict = `Listed as malicious (${reputationResult.threat || 'unspecified threat'}) in URLhaus. Avoid this URL.`;
  } else if (!headersResult.checked) {
    verdict = 'Could not fetch this URL to audit its headers.';
  } else if (headersResult.score < 50) {
    verdict = 'Weak security header configuration. See recommendations below.';
  }

  return new Response(JSON.stringify({
    url: targetUrl,
    domain,
    overall_score: overallScore,
    overall_grade: grade(overallScore),
    verdict,
    security_headers: headersResult,
    reputation: reputationResult,
    attack_surface: surfaceResult,
  }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() },
  });
}
