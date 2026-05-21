#!/usr/bin/env bash
# Seed Firestore retreat_config/inventory document (run once on first deploy)
# Usage: ./scripts/seed-inventory.sh
set -euo pipefail

TOKEN=$(gcloud auth print-access-token --account=ruv@agentics.org)

echo "==> Seeding retreat_config/inventory..."
curl -s -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "x-goog-user-project: agenticsorg" \
  "https://firestore.googleapis.com/v1/projects/agenticsorg/databases/(default)/documents/retreat_config/inventory?updateMask.fieldPaths=soloRemaining&updateMask.fieldPaths=buddyRemaining&updateMask.fieldPaths=suiteRemaining" \
  -d '{
    "fields": {
      "soloRemaining": {"integerValue": "10"},
      "buddyRemaining":  {"integerValue": "50"},
      "suiteRemaining":  {"integerValue": "20"}
    }
  }' | python3 -c "
import sys, json
d = json.load(sys.stdin)
if 'error' in d:
    print('ERROR:', d['error'])
    sys.exit(1)
fields = d.get('fields', {})
print('soloRemaining:', fields.get('soloRemaining', {}).get('integerValue'))
print('buddyRemaining: ', fields.get('buddyRemaining',  {}).get('integerValue'))
print('suiteRemaining: ', fields.get('suiteRemaining',  {}).get('integerValue'))
print('Done.')
"
