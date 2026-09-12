// GET /mcp -> info; POST /mcp -> JSON-RPC 2.0 (protocole MCP, transport Streamable HTTP sans état)
// Expose 7 des outils les plus différenciants de Presend comme "tools" MCP.

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
    name: 'whois_lookup',
    description: "Look up a domain's registrar, registration date, age, and expiration via RDAP.",
    inputSchema: {
      type: 'object',
      properties: { domain: { type: 'string', description: 'Domain name, e.g. example.com' } },
      required: ['domain'],
    },
    endpoint: (args) => `${API_BASE}/whois-lookup?domain=${encodeURIComponent(args.domain)}`,
  },
  {
    name: 'dns_lookup',
    description: 'Look up A, AAAA, CNAME, MX, TXT, NS records for a domain in one call.',
    inputSchema: {
      type: 'object',
      properties: { domain: { type: 'string', description: 'Domain name, e.g. example.com' } },
      required: ['domain'],
    },
    endpoint: (args) => `${API_BASE}/dns-lookup?domain=${encodeURIComponent(args.domain)}`,
  },
  {
    name: 'vulnerability_check',
    description: 'Check a package/version against OSV.dev for known CVEs (npm, PyPI, Go, crates.io, Maven, RubyGems, Packagist, NuGet).',
    inputSchema: {
      type: 'object',
      properties: {
        ecosystem: { type: 'string', description: 'e.g. npm, PyPI, Go' },
        package: { type: 'string', description: 'Package name' },
        version: { type: 'string', description: 'Optional specific version' },
      },
      required: ['ecosystem', 'package'],
    },
    endpoint: (args) => `${API_BASE}/vulnerability-check?ecosystem=${encodeURIComponent(args.ecosystem)}&package=${encodeURIComponent(args.package)}${args.version ? '&version=' + encodeURIComponent(args.version) : ''}`,
  },
  {
    name: 'typosquat_check',
    description: 'Flag a package name that looks like a typo of a well-known npm/PyPI package.',
    inputSchema: {
      type: 'object',
      properties: {
        ecosystem: { type: 'string', description: 'npm or PyPI' },
        package: { type: 'string', description: 'Package name to check' },
      },
      required: ['ecosystem', 'package'],
    },
    endpoint: (args) => `${API_BASE}/typosquat-check?ecosystem=${encodeURIComponent(args.ecosystem)}&package=${encodeURIComponent(args.package)}`,
  },
  {
    name: 'ip_reputation',
    description: 'Check an IPv4 address against Spamhaus DROP (known spam/hijacker netblocks).',
    inputSchema: {
      type: 'object',
      properties: { ip: { type: 'string', description: 'IPv4 address' } },
      required: ['ip'],
    },
    endpoint: (args) => `${API_BASE}/ip-reputation?ip=${encodeURIComponent(args.ip)}`,
  },
  {
    name: 'redirect_trace',
    description: "Follow a URL's full redirect chain hop-by-hop, flagging cross-domain jumps.",
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'URL to trace' } },
      required: ['url'],
    },
    endpoint: (args) => `${API_BASE}/redirect-trace?url=${encodeURIComponent(args.url)}`,
  },
  {
    name: 'repo_health_check',
    description: 'Get stars, forks, license, archived status and days since last push for a GitHub repo.',
    inputSchema: {
      type: 'object',
      properties: { repo: { type: 'string', description: 'owner/name, e.g. lodash/lodash' } },
      required: ['repo'],
    },
    endpoint: (args) => `${API_BASE}/repo-health-check?repo=${encodeURIComponent(args.repo)}`,
  },
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
      serverInfo: { name: 'presend-mcp', version: '1.0.0' },
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
      const url = tool.endpoint(params.arguments || {});
      const res = await fetch(url);
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
