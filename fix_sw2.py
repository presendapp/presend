from pathlib import Path
import sys

# Variante avec .catch()
sw_script2 = """if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}"""

old2 = "<script>\n" + sw_script2 + "\n</script>"
new = '<script src="/sw-register.js"></script>'

files = [f for f in Path(".").rglob("*.html") if ".git" not in f.parts]
total = len(files)
replaced = 0

for i, f in enumerate(files, 1):
    html = f.read_text(encoding="utf-8", errors="ignore")
    if old2 in html:
        new_html = html.replace(old2, new)
        f.write_text(new_html, encoding="utf-8")
        replaced += 1
    if i % 50 == 0:
        print(f"Progress: {i}/{total} ({replaced} modifiées)", file=sys.stderr)

print(f"\n=== RÉSULTAT ===")
print(f"Pages modifiées : {replaced}")
