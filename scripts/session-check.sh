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
data=$(gh search issues --author=presendapp --include-prs --json repository,number,state,commentsCount,updatedAt,isPullRequest --limit 300) || { echo "  ERREUR: recherche GitHub"; exit 1; }
GH_DATA="$data" python3 - <<'EOF'
import json, os, subprocess

ME = 'presendapp'
data = json.loads(os.environ['GH_DATA'])
prs = [d for d in data if d['isPullRequest']]
print(f'  Total: {len(data)} ({len(data) - len(prs)} issues, {len(prs)} PR)')

def api(path):
    out = subprocess.run(
        ['gh', 'api', '--paginate', path, '--jq',
         '.[] | [.user.login, (.submitted_at // .created_at // "")] | @tsv'],
        capture_output=True, text=True)
    if out.returncode != 0:
        raise RuntimeError(out.stderr.strip()[:80])
    return [l.split('\t') for l in out.stdout.splitlines() if l]

def last_word(d):
    repo, num = d['repository']['nameWithOwner'], d['number']
    events = api(f'repos/{repo}/issues/{num}/comments?per_page=100')
    if d['isPullRequest']:
        events += api(f'repos/{repo}/pulls/{num}/reviews?per_page=100')
        events += api(f'repos/{repo}/pulls/{num}/comments?per_page=100')
    events = [e for e in events if len(e) == 2 and e[1]]
    return max(events, key=lambda e: e[1]) if events else None

candidates = [d for d in data if d['state'] == 'open'
              and (d['commentsCount'] > 0 or d['isPullRequest'])]
waiting, bots, errors = [], [], []
for d in candidates:
    try:
        lw = last_word(d)
    except RuntimeError as e:
        errors.append((d, str(e)))
        continue
    if not lw or lw[0] == ME:
        continue
    (bots if lw[0].endswith('[bot]') else waiting).append((d, lw))

def ref(d):
    return f"{d['repository']['nameWithOwner']} #{d['number']}"

print(f"  Ouvertes, dernier mot a quelqu'un d'autre: {len(waiting)} (sur {len(candidates)} ouvertes verifiees)")
for d, (who, when) in sorted(waiting, key=lambda x: x[1][1], reverse=True):
    kind = 'PR   ' if d['isPullRequest'] else 'issue'
    print(f"    {kind} {d['commentsCount']:3d}c  {when[:10]}  {who:22s} {ref(d)}")
if bots:
    print('  Dernier mot = bot: ' + ', '.join(f'{ref(d)} ({w})' for d, (w, _) in bots))
for d, msg in errors:
    print(f'  ERREUR {ref(d)}: {msg}')
EOF
