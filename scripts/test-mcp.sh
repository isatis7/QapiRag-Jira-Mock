#!/usr/bin/env bash
# script to start wiremock + mcp and test MCP get_issue
set -euo pipefail
here=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$here"

echo "Pull images and start services (wiremock + mcp)"
docker compose pull wiremock || true
docker compose up -d --no-deps wiremock mcp

# wait for wiremock
for i in $(seq 1 30); do
  if curl -sS http://127.0.0.1:8092/health 2>/dev/null | grep -q '"status":"UP"'; then
	echo "WireMock ready"; break
  fi
  echo "waiting wiremock... $i"; sleep 2
done

# wait for mcp
for i in $(seq 1 30); do
  if curl -sS http://127.0.0.1:3000/health 2>/dev/null | grep -q '"status":"UP"'; then
	echo "MCP ready"; break
  fi
  echo "waiting mcp... $i"; sleep 2
done

# call MCP get_issue
resp=$(curl -sS -H "Content-Type: application/json" -d '{"issueKey":"QAPI-123"}' http://127.0.0.1:3000/mcp/get_issue)
if echo "$resp" | grep -q '"key".*"QAPI-123"'; then
  echo "MCP get_issue returned expected fixture"
  exit 0
else
  echo "MCP get_issue did not return expected fixture:" >&2
  echo "$resp" >&2
  exit 2
fi


