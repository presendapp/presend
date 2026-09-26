#!/bin/bash
cd "$(dirname "$0")/.." || exit 1
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
echo "=== Conversations suivies (scripts/watch.txt) ==="
while read -r ref base note; do
  [[ -z "$ref" || "$ref" == \#* ]] && continue
  repo="${ref%#*}"; num="${ref#*#}"
  info=$(gh api "repos/$repo/issues/$num" --jq '"\(.comments) \(.state)"' 2>/dev/null) || { echo "  ERREUR   $ref"; continue; }
  count=${info%% *}; state=${info#* }
  last="-"
  [ "$count" -gt 0 ] && last=$(gh api "repos/$repo/issues/$num/comments?per_page=100&page=$(( (count + 99) / 100 ))" --jq '.[-1].user.login')
  flag="        "; [ "$count" -gt "$base" ] && flag="NOUVEAU "
  printf "  %s%-7s %3s/%-3s dernier: %-22s %s\n           %s\n" "$flag" "$state" "$count" "$base" "$last" "$ref" "$note"
done < scripts/watch.txt
echo ""
echo "=== Cibles de demarchage GitHub (issues + PR de presendapp) ==="
gh search issues --author=presendapp --include-prs --json repository,number,state,commentsCount,updatedAt,isPullRequest --limit 300 | python3 -c "
import json, sys
data = json.load(sys.stdin)
prs = [d for d in data if d['isPullRequest']]
print(f'  Total: {len(data)} ({len(data) - len(prs)} issues, {len(prs)} PR)')
active = [d for d in data if d['commentsCount'] > 0]
print(f'  Avec commentaires (a verifier): {len(active)}')
for d in sorted(active, key=lambda x: x['updatedAt'], reverse=True):
    kind = 'PR   ' if d['isPullRequest'] else 'issue'
    print(f\"    {d['state']:8s} {kind} {d['commentsCount']:3d}c  {d['repository']['nameWithOwner']} #{d['number']}\")
"
