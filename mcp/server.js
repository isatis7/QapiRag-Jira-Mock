const express = require('express');
const app = express();
app.use(express.json());

const WIREMOCK_HOST = process.env.WIREMOCK_HOST || 'wiremock';
const WIREMOCK_PORT = process.env.WIREMOCK_PORT || '8080';
const WIREMOCK_BASE = `http://${WIREMOCK_HOST}:${WIREMOCK_PORT}`;

function forwardHeaders(req) {
  const headers = {};
  if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];
  headers['Accept'] = 'application/json';
  return headers;
}

app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

app.post('/mcp/get_issue', async (req, res) => {
  const key = req.body && req.body.issueKey;
  if (!key) return res.status(400).json({ error: 'missing issueKey' });
  try {
    const url = `${WIREMOCK_BASE}/rest/api/3/issue/${encodeURIComponent(key)}`;
    const resp = await fetch(url, { headers: forwardHeaders(req) });
    const contentType = resp.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await resp.json() : await resp.text();
    res.status(resp.status).send(body);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'bad gateway', detail: e.message });
  }
});

app.post('/mcp/search_issues', async (req, res) => {
  const jql = req.body && req.body.jql;
  if (!jql) return res.status(400).json({ error: 'missing jql' });
  try {
    const url = `${WIREMOCK_BASE}/rest/api/3/search?jql=${encodeURIComponent(jql)}`;
    const resp = await fetch(url, { headers: forwardHeaders(req) });
    const contentType = resp.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await resp.json() : await resp.text();
    res.status(resp.status).send(body);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'bad gateway', detail: e.message });
  }
});

app.post('/mcp/get_changelog', async (req, res) => {
  const key = req.body && req.body.issueKey;
  if (!key) return res.status(400).json({ error: 'missing issueKey' });
  try {
    const url = `${WIREMOCK_BASE}/rest/api/3/issue/${encodeURIComponent(key)}?expand=changelog`;
    const resp = await fetch(url, { headers: forwardHeaders(req) });
    const contentType = resp.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await resp.json() : await resp.text();
    res.status(resp.status).send(body);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'bad gateway', detail: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP router listening on ${PORT}, forwarding to ${WIREMOCK_BASE}`);
});

