export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Basic URL validation
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Fetch with timeout and reasonable headers
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PresendBot/1.0; +https://presend.pages.dev)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `HTTP ${response.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const html = await response.text();
    const contentType = response.headers.get('content-type') || '';

    // Only parse HTML responses
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return new Response(JSON.stringify({ error: 'Not an HTML page' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract Open Graph and standard meta tags
    const result = {
      url: targetUrl,
      title: extractMeta(html, 'og:title') || extractTag(html, '<title>', '</title>') || null,
      description: extractMeta(html, 'og:description') || extractMeta(html, 'description') || null,
      image: extractMeta(html, 'og:image') || null,
      siteName: extractMeta(html, 'og:site_name') || null,
      type: extractMeta(html, 'og:type') || 'website',
      favicon: extractFavicon(html, parsedUrl) || null,
      canonical: extractLink(html, 'canonical') || null,
    };

    // Resolve relative URLs to absolute
    if (result.image && !result.image.startsWith('http')) {
      result.image = new URL(result.image, parsedUrl.origin).href;
    }
    if (result.favicon && !result.favicon.startsWith('http')) {
      result.favicon = new URL(result.favicon, parsedUrl.origin).href;
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (e) {
    if (e.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Request timed out' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Extract meta tag content by property or name
function extractMeta(html, property) {
  // Try property="..." first (Open Graph)
  let match = html.match(new RegExp(`<meta[^>]+property=["']${escapeRegex(property)}["'][^>]*>`, 'i'));
  if (!match) {
    // Try name="..." (standard meta)
    match = html.match(new RegExp(`<meta[^>]+name=["']${escapeRegex(property)}["'][^>]*>`, 'i'));
  }
  if (!match) return null;
  
  const contentMatch = match[0].match(/content=["']([^"']*)["']/i);
  return contentMatch ? decodeHtmlEntities(contentMatch[1]).trim() : null;
}

// Extract content between two tags
function extractTag(html, open, close) {
  const idx = html.indexOf(open);
  if (idx === -1) return null;
  const start = idx + open.length;
  const end = html.indexOf(close, start);
  if (end === -1) return null;
  return decodeHtmlEntities(html.slice(start, end)).trim();
}

// Extract link rel="..." href
function extractLink(html, rel) {
  const match = html.match(new RegExp(`<link[^>]+rel=["']${escapeRegex(rel)}["'][^>]*>`, 'i'));
  if (!match) return null;
  const hrefMatch = match[0].match(/href=["']([^"']*)["']/i);
  return hrefMatch ? hrefMatch[1] : null;
}

// Extract favicon from various sources
function extractFavicon(html, parsedUrl) {
  // Try link rel="icon" or "shortcut icon"
  let match = html.match(/<link[^>]+rel=["'](?:shortcut\s+)?icon["'][^>]*>/i);
  if (match) {
    const hrefMatch = match[0].match(/href=["']([^"']*)["']/i);
    if (hrefMatch) return hrefMatch[1];
  }
  // Default to /favicon.ico
  return '/favicon.ico';
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'",
    '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–', '&hellip;': '…',
  };
  return text.replace(/&[#a-zA-Z0-9]+;/g, (entity) => entities[entity] || entity);
}
