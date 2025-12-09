#!/usr/bin/env bash

set -euo pipefail

# Usage: bash meta_page_backend/scripts/test_meta_hook.sh [path/to/test.txt]
# Requires the meta_page_backend server running on port 11204.

BASE_URL=${BASE_URL:-"http://localhost:11204/api/v1"}
TEST_FILE=${1:-"test.txt"}
VERIFY_TOKEN=${VERIFY_TOKEN:-"ren_verify_12345"}
CHALLENGE=${CHALLENGE:-"challenge-$(date +%s)"}

if [[ ! -f "$TEST_FILE" ]]; then
  echo "Test file not found: $TEST_FILE"
  exit 1
fi

PAGE_ID=$(grep -oE 'Page ID="[^"]+"' "$TEST_FILE" | head -n1 | sed 's/.*="//;s/"$//')
ACCESS_TOKEN=$(grep -oE 'Page Access Token="[^"]+"' "$TEST_FILE" | head -n1 | sed 's/.*="//;s/"$//')

if [[ -z "$PAGE_ID" || -z "$ACCESS_TOKEN" ]]; then
  echo "Failed to parse Page ID or Access Token from $TEST_FILE"
  exit 1
fi

echo "==> GET /meta_hook (webhook verification)"
curl -i "${BASE_URL}/meta_hook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${CHALLENGE}"
echo
echo

POST_TIMESTAMP_MS=$(($(date +%s) * 1000))
PAYLOAD=$(cat <<EOF
{
  "object": "page",
  "entry": [
    {
      "id": "$PAGE_ID",
      "time": $POST_TIMESTAMP_MS,
      "messaging": [
        {
          "sender": { "id": "TEST_SENDER_ID" },
          "recipient": { "id": "$PAGE_ID" },
          "timestamp": $POST_TIMESTAMP_MS,
          "message": { "mid": "mid.$POST_TIMESTAMP_MS", "text": "這是測試用口令" }
        }
      ]
    }
  ]
}
EOF
)

echo "==> POST /meta_hook (webhook event)"
curl -i -X POST "${BASE_URL}/meta_hook" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
echo
