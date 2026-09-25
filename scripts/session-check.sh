#!/bin/bash
echo "=== Etat verifie du projet Presend ($(date '+%Y-%m-%d')) ==="
echo ""
echo "Endpoints API (openapi.json):"
python3 -c "import json; print(' ', len(json.load(open('openapi.json'))['paths']))"
echo ""
echo "Outils navigateur (tools/):"
echo "  $(ls tools/*.html 2>/dev/null | wc -l)"
echo ""
echo "Outils MCP (functions/mcp.js):"
python3 -c "
import re
content = open('functions/mcp.js').read()
tools = set(re.findall(r\"name: '(\w+)'\", content))
tools.discard('presend_mcp')
print(' ', len(tools))
"
echo ""
echo "=== Cibles de demarchage GitHub (gh search) ==="
gh search issues --author=presendapp --json repository,number,state,commentsCount,updatedAt --limit 100 | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'  Total: {len(data)}')
active = [d for d in data if d['commentsCount'] > 0]
print(f'  Avec commentaires (a verifier): {len(active)}')
for d in sorted(active, key=lambda x: x['updatedAt'], reverse=True)[:10]:
    print(f\"    {d['state']:8s} {d['commentsCount']}c  {d['repository']['nameWithOwner']} #{d['number']}\")
"
