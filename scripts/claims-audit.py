#!/usr/bin/env python3
"""Scan des affirmations publiques interdites (lecons n°1, 2, 9, 14 de PROJECT_CONTEXT.md).
Couvre : corps des issues/PR ouvertes OU commentees par presendapp, nos commentaires dedans,
README et releases de nos depots (hors forks), ET les fichiers publies par le site (pages .html
dont outils et traductions, openapi*.json, functions/mcp.js, README.md), lus dans le depot.
Ne modifie rien. Usage : python3 scripts/claims-audit.py [--local]
  --local : fichiers du depot seulement (rapide, sans GitHub), a lancer avant un commit.
Ajouter un motif ici a chaque nouvelle lecon sur une affirmation a ne plus faire."""
import json, re, subprocess, base64, sys, html
NEVER = r"(?!)"  # aucun contexte ne rend l'occurrence correcte
PATTERNS = {  # nom -> (motif, motif de contexte qui rend l'occurrence correcte)
    "ua-parser/colors presentes comme detectes": (r"ua-parser-js|colors\.js", r"cannot|can't|not detect|does not|doesn't|invisible|Corrected|Correction|\*\*not\*\*"),
    "exclusivite ('nothing else free')": (r"nothing else (free|does)|unlike every|only free (tool|api)", r"we know of"),
    "Spamhaus en contexte promotionnel": (r"spamhaus", r"terms|attribution|credit|licens|promotional copy|section 3\.2|fetch|download|drop_v4|spamhaus_drop|DROP Terms|\"source\"|maintained by The Spamhaus Project|What is Spamhaus|not on Spamhaus DROP|wraps Spamhaus DROP"),
    "maintainer-change associe a PyPI": (r"npm/PyPI[^.\n]{0,40}maintainer|maintainer[^.\n]{0,60}(npm/PyPI|PyPI|crates)", r"npm-only|npm only|currently np|clarified|npm maintainer-change|npm dependencies with"),
    # 26 sept. : affirmations retirees des pages API (8 langues)
    "promesse de delivrabilite (MX seulement)": (r"(verif\w*|check\w*|confirm\w*|test\w*|guarantee\w*)\s+(the\s+|real\s+)?deliverability|deliverability check", r"does not|doesn't|cannot|can't|not a |no mailbox|not probe"),
    "concurrents 'separement et payants'": (r"separately and (paid|for a fee)|only separately[^.]{0,30}paid|s[ée]par[ée]ment et payant|separat und kostenpflichtig|por separado y de pago|separadamente e pagas|по отдельности и платно|個別の有料|अलग-अलग और भुगतान", NEVER),
    "exclusivite ('aucune autre API gratuite')": (r"no other free api|aucune autre api gratuite|keine andere uns bekannte kostenlose|ninguna otra api gratuita|nenhuma outra api gratuita|ни один другой известный нам бесплатный|他の無料APIは知りません|कोई अन्य मुफ़्त API", NEVER),
    "pas d'endpoint serveur pour les outils fichiers (faux)": (r"pas de point de terminaison serveur", NEVER),
    "mot de passe 'jamais transmis en entier' (faux en GET)": (r"never (sent|transmitted|logged)[^.]{0,25}(in full|full)|(sent|transmitted) in full|full password is never|jamais (envoy|transmis)[^.]{0,25}(en entier|complet)", NEVER),
}
INTERNAL = {'PROJECT_CONTEXT.md', 'STRUCTURE.md', 'ROADMAP.md', 'WORKFLOW.md', 'SECURITY_DISCLOSURES.md'}
def gh(a):
    r = subprocess.run(['gh'] + a, capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except Exception: return None
texts = []
# 1. Fichiers publies par le site (versionnes uniquement)
files = subprocess.run(['git', 'ls-files', '*.html', 'openapi*.json', 'functions/mcp.js', 'README.md'],
                       capture_output=True, text=True).stdout.split()
for f in files:
    if f.startswith('vendor/') or f in INTERNAL: continue
    t = open(f, encoding='utf-8', errors='ignore').read()
    if f.endswith('.html'):
        t = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', t, flags=re.S)
        t = html.unescape(re.sub(r'<[^>]+>', ' ', t))
    texts.append((f"site: {f}", t))
n_local = len(texts)
# 2. GitHub (sauf --local)
seen = set()
if '--local' not in sys.argv:
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
            hits += 1; print(f"[{name}] {where}\n    ...{' '.join(ctx[150:].split())[:260]}...\n")
print(f"{len(texts)} textes examines ({n_local} fichiers du site, {len(seen)} conversations), {hits} occurrence(s) a verifier.")
