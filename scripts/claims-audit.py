#!/usr/bin/env python3
"""Scan des affirmations publiques interdites (lecons n°1, 2, 9 de PROJECT_CONTEXT.md).
Couvre : corps des issues/PR ouvertes OU commentees par presendapp, nos commentaires dedans,
README et releases de nos depots (hors forks). Ne modifie rien. Usage : python3 scripts/claims-audit.py
Ajouter un motif ici a chaque nouvelle lecon sur une affirmation a ne plus faire."""
import json, re, subprocess, base64
PATTERNS = {  # nom -> (motif, motif de contexte qui rend l'occurrence correcte)
    "ua-parser/colors presentes comme detectes": (r"ua-parser-js|colors\.js", r"cannot|can't|not detect|does not|doesn't|invisible|Corrected|Correction|\*\*not\*\*"),
    "exclusivite ('nothing else free')": (r"nothing else (free|does)|unlike every|only free (tool|api)", r"we know of"),
    "Spamhaus en contexte promotionnel": (r"spamhaus", r"terms|attribution|credit|licens|promotional copy|section 3\.2|fetch|download|drop_v4|spamhaus_drop|DROP Terms"),
    "maintainer-change associe a PyPI": (r"npm/PyPI[^.\n]{0,40}maintainer|maintainer[^.\n]{0,60}(npm/PyPI|PyPI|crates)", r"npm-only|npm only|currently np|clarified|npm maintainer-change|npm dependencies with"),
}
def gh(a):
    r = subprocess.run(['gh'] + a, capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except Exception: return None
texts = []
seen = set()
for flag in ('--author=presendapp', '--commenter=presendapp'):
    for i in gh(['search', 'issues', flag, '--include-prs', '--json', 'repository,number', '--limit', '300']) or []:
        repo, n = i['repository']['nameWithOwner'], i['number']
        if (repo, n) in seen or repo.lower().startswith('presendapp/'): continue
        seen.add((repo, n))
        it = gh(['api', f'repos/{repo}/issues/{n}', '--jq', '{b: .body, a: .user.login}']) or {}
        if it.get('a') == 'presendapp': texts.append((f"{repo}#{n} (corps)", it.get('b') or ''))
        for c in gh(['api', f'repos/{repo}/issues/{n}/comments?per_page=100']) or []:
            if c['user']['login'] == 'presendapp': texts.append((f"{repo}#{n} (commentaire {c['html_url'].split('#')[-1]})", c['body'] or ''))
for r in gh(['repo', 'list', 'presendapp', '--limit', '100', '--json', 'name,isFork', '--jq', '[.[] | select(.isFork | not) | .name]']) or []:
    rd = gh(['api', f'repos/presendapp/{r}/readme', '--jq', '{c: .content}'])
    if rd: texts.append((f"presendapp/{r} README", base64.b64decode(rd['c']).decode('utf-8', 'ignore')))
    for x in gh(['api', f'repos/presendapp/{r}/releases?per_page=100']) or []: texts.append((f"presendapp/{r} release {x['tag_name']}", x.get('body') or ''))
hits = 0
for name, (pat, ok) in PATTERNS.items():
    for where, t in texts:
        for m in re.finditer(pat, t, re.I):
            ctx = t[max(0, m.start() - 200): m.end() + 200]
            if re.search(ok, ctx, re.I): continue
            hits += 1; print(f"[{name}] {where}\n    ...{ctx[150:].replace(chr(10), ' ')[:260]}...\n")
print(f"{len(texts)} textes examines ({len(seen)} conversations), {hits} occurrence(s) a verifier.")
