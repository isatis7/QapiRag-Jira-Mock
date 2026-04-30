#!/usr/bin/env bash
# Script simple pour vérifier l'état du mock WireMock
set -euo pipefail

BASE_URL=${1:-http://127.0.0.1:8092}

echo "Checking WireMock admin mappings..."
curl -fsS "$BASE_URL/__admin/mappings" | jq '.mappings | length' || (echo "Failed to get mappings" && exit 2)

echo "Checking /health endpoint..."
curl -fsS "$BASE_URL/health" | jq . || (echo "Health endpoint failed" && exit 3)

echo "Checking sample stub /rest/api/3/issue/QAPI-123 (with Authorization)..."
curl -fsS -H "Authorization: Bearer dummy" "$BASE_URL/rest/api/3/issue/QAPI-123" | jq '{key: .key, id: .id, summary: .fields.summary}' || (echo "Stub request failed" && exit 4)

echo "All checks OK"

