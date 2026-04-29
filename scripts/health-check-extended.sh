#!/usr/bin/env bash
set -euo pipefail

MCP_HOST=${1:-http://localhost:3000}
WIREMOCK_HOST=${2:-http://localhost:8080}

echo "Checking MCP health at $MCP_HOST/health"
curl -fsS "$MCP_HOST/health" | jq .

# Try a GET issue (success expected if mappings include QAPI-123)
echo "Testing get_issue (expect 200)"
curl -sS -X POST "$MCP_HOST/mcp/get_issue" -H 'Content-Type: application/json' -H 'Authorization: Bearer dummy' -d '{"issueKey":"QAPI-123"}' | jq .

# Test create (expect 201 or other depending on mappings)
echo "Testing create_issue (proxy)"
curl -sS -X POST "$MCP_HOST/mcp/create_issue" -H 'Content-Type: application/json' -H 'Authorization: Bearer editor' -d '{"fields":{"summary":"Created by health check"}}' | jq .

# Test search
echo "Testing search_issues"
curl -sS -X POST "$MCP_HOST/mcp/search_issues" -H 'Content-Type: application/json' -H 'Authorization: Bearer dummy' -d '{"jql":"project=QAPI"}' | jq .

echo "Health check complete"

