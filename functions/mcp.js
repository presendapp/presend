// GET /mcp -> info; POST /mcp -> JSON-RPC 2.0 (protocole MCP, transport Streamable HTTP sans état)
// Expose 33 des 39 endpoints comme "tools" MCP -- tous sauf les 7 endpoints
// binaires/fichiers (hash, clean-image, malware-check, file-type, image-similarity,
// merge-and-compress-pdf, qr-scan), délibérément exclus : faire transiter du contenu
// binaire encodé en base64 dans le contexte d'un agent IA est généralement peu pratique,
// pas seulement techniquement plus complexe.
// Généré automatiquement à partir de openapi.json -- garantit la cohérence avec la doc réelle.

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version',
    ...extra,
  };
}

const PROTOCOL_VERSION = '2025-06-18';
const API_BASE = 'https://presend.pages.dev/api';

const TOOLS = [
  {
    name: 'ai_crawler_check',
    description: "Check which AI crawlers are allowed by robots.txt",
    inputSchema: {"type": "object", "properties": {"domain": {"type": "string", "description": "Domain to check, e.g. example.com. robots.txt is fetched from https://<domain>/robots.txt."}}, "required": ["domain"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/ai-crawler-check?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'base64',
    description: "Encode or decode Base64",
    inputSchema: {"type": "object", "properties": {"action": {"type": "string", "description": "Either \\\"encode\\\" or \\\"decode\\\"."}, "text": {"type": "string", "description": "Text to encode, or Base64 string to decode."}}, "required": ["action", "text"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/base64?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'color',
    description: "Convert color formats",
    inputSchema: {"type": "object", "properties": {"hex": {"type": "string", "description": "Hex color code, e.g. #ff0000 or ff0000. Provide exactly one of hex, rgb, or hsl."}, "rgb": {"type": "string", "description": "RGB color, e.g. 255,0,0. Provide exactly one of hex, rgb, or hsl."}, "hsl": {"type": "string", "description": "HSL color, e.g. 0,100%,50%. Provide exactly one of hex, rgb, or hsl."}}, "required": []},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/color?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'csv_json',
    description: "Convert between JSON and CSV (GET)",
    inputSchema: {"type": "object", "properties": {"direction": {"type": "string", "description": "Either \\\"csv-to-json\\\" or \\\"json-to-csv\\\"."}, "data": {"type": "string", "description": "The CSV or JSON text to convert, matching the chosen direction."}}, "required": ["direction", "data"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/csv-json?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'dns_lookup',
    description: "DNS record lookup (A, AAAA, CNAME, MX, TXT, NS)",
    inputSchema: {"type": "object", "properties": {"domain": {"type": "string", "description": "Domain to look up, e.g. example.com."}, "type": {"type": "string", "description": "Narrow to a single record type. Omit to get all 6 at once."}}, "required": ["domain"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/dns-lookup?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'email_disposable',
    description: "Detect disposable email domains",
    inputSchema: {"type": "object", "properties": {"email": {"type": "string", "description": "Email address to check against a list of known disposable/temporary email domains."}}, "required": ["email"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/email-disposable?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'email_security',
    description: "Domain email anti-spoofing check (SPF/DMARC/DKIM)",
    inputSchema: {"type": "object", "properties": {"domain": {"type": "string", "description": "Domain to check SPF, DKIM, and DMARC records for, e.g. example.com."}}, "required": ["domain"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/email-security?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'email_validate',
    description: "Validate an email address",
    inputSchema: {"type": "object", "properties": {"email": {"type": "string", "description": "Email address to validate for correct syntax and a resolvable domain."}}, "required": ["email"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/email-validate?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'email_verify',
    description: "Combined email verification",
    inputSchema: {"type": "object", "properties": {"email": {"type": "string", "description": "Email address to run through combined syntax, disposable-domain, and MX-record checks."}}, "required": ["email"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/email-verify?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'favicon',
    description: "Fetch a domain's favicon URL",
    inputSchema: {"type": "object", "properties": {"domain": {"type": "string", "description": "Domain to fetch the favicon URL for, e.g. example.com."}}, "required": ["domain"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/favicon?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'ip',
    description: "Get caller IP geolocation",
    inputSchema: {"type": "object", "properties": {}, "required": []},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/ip?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'ip_reputation',
    description: "IP reputation check (Spamhaus DROP)",
    inputSchema: {"type": "object", "properties": {"ip": {"type": "string", "description": "IPv4 address to check against the Spamhaus DROP list of known spam/hijacker netblocks."}}, "required": ["ip"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/ip-reputation?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'jwt_decode',
    description: "Decode a JWT",
    inputSchema: {"type": "object", "properties": {"token": {"type": "string", "description": "The JWT to decode. Decodes header and payload only -- does not verify the signature (use /jwt-verify for that)."}}, "required": ["token"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/jwt-decode?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'jwt_verify',
    description: "Verify a JWT's cryptographic signature",
    inputSchema: {"type": "object", "properties": {"token": {"type": "string", "description": "The JWT to verify. Checks the cryptographic signature -- use /jwt-decode if you only need to read the header and payload."}, "secret": {"type": "string", "description": "Required for HS256/384/512."}, "jwk": {"type": "object", "description": "Public key in JWK format, for RS/PS/ES algorithms."}, "jwks_url": {"type": "string", "description": "URL to a JWKS document; the key is matched by the token's \"kid\" header."}}, "required": ["token"]},
    request: (args) => ({ method: 'POST', url: `${API_BASE}/jwt-verify`, body: JSON.stringify(args) }),
  },
  {
    name: 'maintainer_change_check',
    description: "Detect a suspicious npm package maintainer change",
    inputSchema: {"type": "object", "properties": {"ecosystem": {"type": "string", "description": "Currently only \\\"npm\\\" is supported."}, "package": {"type": "string", "description": "Package name, e.g. lodash"}}, "required": ["ecosystem", "package"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/maintainer-change-check?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'password',
    description: "Generate a secure password",
    inputSchema: {"type": "object", "properties": {"length": {"type": "string", "description": "Desired password length. Defaults to a reasonable secure length if omitted."}, "symbols": {"type": "string", "description": "Whether to include symbol characters. 1 for yes, 0 for no."}, "uppercase": {"type": "string", "description": "Whether to include uppercase letters. 1 for yes, 0 for no."}, "numbers": {"type": "string", "description": "Whether to include numeric digits. 1 for yes, 0 for no."}, "exclude_ambiguous": {"type": "string", "description": "Whether to exclude visually ambiguous characters (e.g. 0/O, 1/l). 1 for yes, 0 for no."}}, "required": []},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/password?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'password_breach',
    description: "Check if a password has been breached",
    inputSchema: {"type": "object", "properties": {"password": {"type": "string", "description": "Password to check against known data-breach corpora. Checked via k-anonymity (only a partial hash prefix is sent) -- the full password is never transmitted."}}, "required": ["password"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/password-breach?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'password_check',
    description: "Combined password strength + breach check",
    inputSchema: {"type": "object", "properties": {"password": {"type": "string", "description": "Password to evaluate for strength (length, character variety, common patterns)."}, "check_breach": {"type": "boolean", "description": "Whether to also check the password against known data-breach corpora via k-anonymity. true or false."}}, "required": ["password"]},
    request: (args) => ({ method: 'POST', url: `${API_BASE}/password-check`, body: JSON.stringify(args) }),
  },
  {
    name: 'phone_verify',
    description: "Validate and format a phone number",
    inputSchema: {"type": "object", "properties": {"number": {"type": "string", "description": "Phone number to validate and format, ideally in E.164 format (e.g. +14155552671)."}, "country": {"type": "string", "description": "ISO 3166-1 alpha-2 country code (e.g. US, FR), used to interpret a number with no leading +."}}, "required": ["number"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/phone-verify?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'redirect_trace',
    description: "Full redirect chain trace",
    inputSchema: {"type": "object", "properties": {"url": {"type": "string", "description": "URL to follow the full redirect chain for, hop by hop."}}, "required": ["url"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/redirect-trace?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'repo_health_check',
    description: "GitHub repository health signals",
    inputSchema: {"type": "object", "properties": {"repo": {"type": "string", "description": "GitHub repository in owner/name format, e.g. lodash/lodash."}}, "required": ["repo"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/repo-health-check?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'security_headers',
    description: "Audit HTTP security headers",
    inputSchema: {"type": "object", "properties": {"url": {"type": "string", "description": "URL to audit HTTP security headers for (CSP, HSTS, X-Frame-Options, etc.)."}}, "required": ["url"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/security-headers?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'security_scan',
    description: "Combined security posture report",
    inputSchema: {"type": "object", "properties": {"url": {"type": "string", "description": "URL to run a combined security posture check against (headers, reputation, and related signals)."}}, "required": ["url"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/security-scan?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'subdomains',
    description: "Passive subdomain discovery",
    inputSchema: {"type": "object", "properties": {"domain": {"type": "string", "description": "Domain to passively discover subdomains for via Certificate Transparency logs, e.g. example.com."}}, "required": ["domain"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/subdomains?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'text_similarity',
    description: "Text similarity via SimHash (1 or 2 texts)",
    inputSchema: {"type": "object", "properties": {"texts": {"type": "array", "description": "1 text (hash only) or 2 texts (compare). Max 200,000 characters each."}}, "required": ["texts"]},
    request: (args) => ({ method: 'POST', url: `${API_BASE}/text-similarity`, body: JSON.stringify(args) }),
  },
  {
    name: 'timestamp',
    description: "Convert timestamps",
    inputSchema: {"type": "object", "properties": {"unix": {"type": "string", "description": "Unix timestamp (seconds since epoch) to convert to a human-readable date. Provide either unix or date, not both."}, "date": {"type": "string", "description": "Date/time string to convert to a Unix timestamp. Provide either unix or date, not both."}}, "required": []},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/timestamp?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'typosquat_check',
    description: "Package name typosquatting check",
    inputSchema: {"type": "object", "properties": {"ecosystem": {"type": "string", "description": "Package ecosystem, e.g. npm or PyPI."}, "package": {"type": "string", "description": "Package name to check for likely typosquatting of a well-known package in the given ecosystem."}}, "required": ["ecosystem", "package"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/typosquat-check?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'url_clean',
    description: "Clean a single URL",
    inputSchema: {"type": "object", "properties": {"url": {"type": "string", "description": "URL to strip tracking parameters from (utm_*, fbclid, gclid, and similar)."}}, "required": ["url"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/url-clean?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'url_reputation',
    description: "Check URL against malware/phishing database",
    inputSchema: {"type": "object", "properties": {"url": {"type": "string", "description": "URL to check against known phishing/malware URL databases."}}, "required": ["url"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/url-reputation?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'user_agent',
    description: "Parse a User-Agent string",
    inputSchema: {"type": "object", "properties": {"ua": {"type": "string", "description": "User-Agent string to parse. If omitted, the request's own User-Agent header is parsed instead."}}, "required": []},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/user-agent?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'uuid',
    description: "Generate UUIDs",
    inputSchema: {"type": "object", "properties": {"count": {"type": "string", "description": "Number of UUIDs (v4) to generate. Defaults to 1 if omitted."}}, "required": []},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/uuid?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'vulnerability_check',
    description: "Package vulnerability check (OSV.dev)",
    inputSchema: {"type": "object", "properties": {"ecosystem": {"type": "string", "description": "Package ecosystem, e.g. npm, PyPI, Go, crates.io, Maven, RubyGems, Packagist, or NuGet."}, "package": {"type": "string", "description": "Package name to check against OSV.dev for known CVEs."}, "version": {"type": "string", "description": "Omit to check all versions of the package."}}, "required": ["ecosystem", "package"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/vulnerability-check?${new URLSearchParams(args).toString()}` }),
  },
  {
    name: 'whois_lookup',
    description: "Domain registration lookup (WHOIS via RDAP)",
    inputSchema: {"type": "object", "properties": {"domain": {"type": "string", "description": "Domain to look up registration details for via RDAP, e.g. example.com."}}, "required": ["domain"]},
    request: (args) => ({ method: 'GET', url: `${API_BASE}/whois-lookup?${new URLSearchParams(args).toString()}` }),
  }
];

function jsonRpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}
function jsonRpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

async function handleRequest(body) {
  const { id, method, params } = body;

  if (method === 'initialize') {
    return jsonRpcResult(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: 'presend-mcp', version: '2.0.0' },
    });
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'tools/list') {
    return jsonRpcResult(id, {
      tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
    });
  }

  if (method === 'tools/call') {
    const tool = TOOLS.find((t) => t.name === params?.name);
    if (!tool) {
      return jsonRpcError(id, -32602, `Unknown tool: ${params?.name}`);
    }
    try {
      const { method: httpMethod, url, body: reqBody } = tool.request(params.arguments || {});
      const fetchOpts = { method: httpMethod };
      if (reqBody) {
        fetchOpts.headers = { 'Content-Type': 'application/json' };
        fetchOpts.body = reqBody;
      }
      const res = await fetch(url, fetchOpts);
      const data = await res.json();
      return jsonRpcResult(id, {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        isError: !res.ok,
      });
    } catch (e) {
      return jsonRpcResult(id, {
        content: [{ type: 'text', text: `Error: ${e.message}` }],
        isError: true,
      });
    }
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet() {
  return new Response(JSON.stringify({
    name: 'Presend MCP Server',
    protocol: 'Model Context Protocol (Streamable HTTP)',
    protocolVersion: PROTOCOL_VERSION,
    tool_count: TOOLS.length,
    tools: TOOLS.map((t) => t.name),
    usage: 'POST JSON-RPC 2.0 requests to this same URL.',
  }, null, 2), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

export async function onRequestPost(context) {
  const { request } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify(jsonRpcError(null, -32700, 'Parse error')), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const result = await handleRequest(body);
  if (result === null) {
    return new Response(null, { status: 202, headers: corsHeaders() });
  }
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
