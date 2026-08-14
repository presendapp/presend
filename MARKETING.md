# Presend — Marketing Kit & Launch Plan

## Positioning

**Tagline:** Free browser-based privacy tools. Clean, compress, convert files. No upload, no account, no tracking.

**Angle unique:** Everything runs locally in your browser. Your files never leave your device.

---

## Phase 1: Soft Launch (Semaine 1)

### Reddit (haute priorite)

**r/privacy** — Post "Showcase Saturday"
Title: I built a set of free privacy tools that run entirely in your browser — no upload, no account, no tracking

Body:
Hey r/privacy,

I got tired of uploading sensitive files to random "free" online tools that clearly send everything to their servers. So I built Presend — a collection of 20+ browser-based tools to clean, compress, convert and check your files before you share them.

Everything runs locally:
- EXIF Remover (strip GPS/camera data from photos)
- PDF Metadata Remover (clear author, software, dates)
- HEIC to JPG Converter
- File Hash Checker (SHA-256)
- URL Cleaner (remove tracking params)
- And 15+ more

No server ever sees your file. No account needed. No ads.

Would love your feedback — especially if you find any edge cases or missing tools.

https://presend.pages.dev

---

**r/webdev** — Post "I built this"
Title: I built a privacy-focused microtools site on Cloudflare Pages — 20 tools, zero backend, zero cost

Body:
Stack: Vanilla HTML/JS, Cloudflare Pages, no framework, no build step.

Lessons learned:
- Cloudflare Pages handles pretty URLs natively
- 1.3MB heic2any.js is the heaviest asset — loaded only on the converter page
- All file processing is done client-side with FileReader + Blob APIs
- JSON-LD + FAQPage schema for every tool = rich snippets potential

Open to questions about the architecture or the SEO strategy.

https://presend.pages.dev

---

**r/SideProject** — Post "Just launched"
Title: Presend — 20 free privacy tools that run entirely in your browser

Body:
Launched this week. 747 visits in 11 days, mostly organic + some bot traffic.

Core tools:
- Remove EXIF/GPS from photos
- Strip metadata from PDFs
- Convert HEIC to JPG
- Check file integrity (SHA-256)
- Clean URLs of tracking parameters

All client-side. No server. No cost to run.

What would you add next?

---

## Phase 2: Directories & Backlinks (Semaine 2)

### Product Hunt
- Title: Presend — Privacy tools that run in your browser
- Tagline: Clean, compress, convert files. No upload, no account.
- Topics: Privacy, Productivity, Open Source, Developer Tools
- Maker comment: "Built this because I was tired of uploading sensitive files to sketchy online tools. Everything runs locally."

### AlternativeTo.net
- Submit as alternative to: SmallPDF, iLovePDF, EXIF Purge, ImageOptim
- Categories: File Converter, Privacy Tool, Image Optimizer

### Hacker News "Show HN"
- Title: Show HN: Presend — Browser-based privacy tools, no server involved
- Focus on technical architecture (client-side processing, zero backend cost)

### Awesome Privacy (GitHub)
- PR to add Presend to "Image Tools" and "PDF Tools" sections
- https://github.com/Lissy93/awesome-privacy

### Indie Hackers
- Post in "Ideas & Validation" or "Showcase"
- Share revenue numbers (even if $0) and traffic stats

---

## Phase 3: Content & SEO (Mois 2-3)

### Blog/Guides to write
1. "How to Remove EXIF Data from Photos: Complete Guide 2026"
2. "5 Ways to Compress Images for Email Without Losing Quality"
3. "Why You Should Check File Hashes Before Installing Software"
4. "How to Clean URLs Before Sharing on Social Media"
5. "HEIC vs JPG: Why iPhone Photos Don't Open on Windows"

### Guest posts
- CSS-Tricks, Smashing Magazine, Dev.to
- Topics: "Building privacy-first web apps" or "Client-side file processing with JavaScript"

---

## Phase 4: Communities & Forums (Ongoing)

### Quora
- Answer questions about metadata removal, file conversion, privacy tools

### Stack Overflow / Super User
- Answer relevant questions, mention Presend when genuinely helpful

### Twitter/X
- Thread: "I built 20 privacy tools in 2 weeks. Here's what I learned."
- Daily tool tip: "Did you know your iPhone photos contain GPS coordinates?"

### LinkedIn
- Post about the privacy angle: "Why I built a tool that never sees your files"

---

## KPIs to Track

| Metric | Target (Mois 1) | Target (Mois 3) |
|--------|----------------|-----------------|
| Visites/mois | 1 000 | 5 000 |
| Pages indexees Google | 30 | 60 |
| Backlinks | 5 | 20 |
| Conversions affiliation | 0 | 5-10 |
| Revenus | 0 EUR | 50-200 EUR |

---

## Tools for Tracking

- Google Search Console — indexation, requetes, erreurs
- Cloudflare Analytics — trafic, pays, referrers
- Bing Webmaster Tools — indexation Bing (IndexNow active)
- Ahrefs Webmaster Tools (gratuit) — backlinks, mots-cles
- Google PageSpeed Insights — Core Web Vitals

---

## Tips for Success

1. Never spam — participe d'abord, partage ensuite
2. Soyez authentique — les communautes detectent les promotions forcees
3. Repondez aux commentaires — engagement = visibilite
4. Itérez rapidement — ajoutez les outils demandes par la communaute
5. Mesurez tout — UTM tags sur les liens partages (?utm_source=reddit&utm_medium=social)

---

## Checklist de lancement

- [x] Site deploye sur Cloudflare Pages
- [x] Sitemap.xml valide
- [x] IndexNow configure
- [x] Google Search Console verifie
- [x] Meta robots sur toutes les pages
- [x] Canonicals corriges
- [x] Maillage interne (outils <-> guides)
- [ ] Product Hunt submission
- [ ] Reddit posts (r/privacy, r/webdev, r/SideProject)
- [ ] AlternativeTo.net submission
- [ ] Hacker News "Show HN"
- [ ] Awesome Privacy PR
- [ ] 3 articles de blog publies
- [ ] UTM tags sur tous les liens partages
