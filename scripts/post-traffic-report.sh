#!/bin/bash
# Exécute check-traffic.sh, puis publie le résumé comme discussion GitHub
# dans la catégorie Announcements.
set -e

REPO_ID="R_kgDOTOZSwg"
CATEGORY_ID="DIC_kwDOTOZSws4DFhFT"  # Announcements
WEEK=$(date -u +%Y-%m-%d)

REPORT=$(bash "$(dirname "$0")/check-traffic.sh" 7)

BODY=$(python3 -c "
import json, sys
report = sys.stdin.read()
body = f'''Weekly traffic snapshot -- {sys.argv[1]}

\`\`\`
{report}
\`\`\`

Generated automatically from Cloudflare Web Analytics.'''
print(json.dumps(body))
" "$WEEK" <<< "$REPORT")

TITLE="Weekly traffic snapshot -- $WEEK"

gh api graphql -f query="
mutation {
  createDiscussion(input: {
    repositoryId: \"$REPO_ID\",
    categoryId: \"$CATEGORY_ID\",
    title: \"$TITLE\",
    body: $BODY
  }) {
    discussion { url }
  }
}"
