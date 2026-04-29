const express = require('express');
const app = express();
app.use(express.json());

const WIREMOCK_HOST = process.env.WIREMOCK_HOST || 'wiremock';
const WIREMOCK_PORT = process.env.WIREMOCK_PORT || '8080';
const WIREMOCK_BASE = `http://${WIREMOCK_HOST}:${WIREMOCK_PORT}`;
// If MCP_ENFORCE_AUTH=true, MCP will reject unknown tokens with 403.
// Default: false -> MCP forwards Authorization to the backend (more realistic)
const ENFORCE_AUTH = process.env.MCP_ENFORCE_AUTH === 'true';

// Simple token -> role mapping for tests. Start with three tokens as agreed.
const TOKEN_ROLES = {
  'Bearer dummy': 'reader',
  'Bearer editor': 'editor',
  'Bearer admin': 'admin'
};

// Middleware: require Authorization header and optionally validate token -> role
app.use((req, res, next) => {
  // allow health endpoint without auth
  if (req.path === '/health') return next();

  const auth = req.headers['authorization'];
  if (!auth) {
    return res.status(401).json({ errorMessages: ['You are not authenticated'], errors: {} });
  }
  const role = TOKEN_ROLES[auth];
  if (!role) {
    if (ENFORCE_AUTH) {
      return res.status(403).json({ errorMessages: ['Forbidden: unknown token'], errors: {} });
    }
    // not enforcing auth: still attach token info but unknown role
    req.user = { token: auth, role: 'unknown' };
    return next();
  }
  req.user = { token: auth, role };
  next();
});

// Middleware: optional latency injection for testing slow responses.
// Clients may send `X-Mock-Latency: <ms>` header or include `latency` in JSON body.
app.use(async (req, res, next) => {
  const headerLatency = req.headers['x-mock-latency'];
  const bodyLatency = req.body && req.body.latency;
  const latency = parseInt(headerLatency || bodyLatency || 0, 10);
  if (latency > 0) {
    await new Promise(r => setTimeout(r, Math.min(latency, 120000))); // cap at 2min
  }
  next();
});

function forwardHeaders(req) {
  const headers = {};
  if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];
  // Forward a lightweight mock role header so WireMock mappings can react to roles if needed
  if (req.user && req.user.role) headers['X-Mock-Role'] = req.user.role;
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
    const contentType = (resp.headers && typeof resp.headers.get === 'function') ? resp.headers.get('content-type') : (resp.headers && resp.headers['content-type']) || '';
    const body = contentType && contentType.includes('application/json') ? await resp.json() : await resp.text();
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
    const contentType = (resp.headers && typeof resp.headers.get === 'function') ? resp.headers.get('content-type') : (resp.headers && resp.headers['content-type']) || '';
    const body = contentType && contentType.includes('application/json') ? await resp.json() : await resp.text();
    res.status(resp.status).send(body);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'bad gateway', detail: e.message });
  }
});

// Create issue
app.post('/mcp/create_issue', async (req, res) => {
  const payload = req.body;
  if (!payload) return res.status(400).json({ error: 'missing body' });
  try {
    const url = `${WIREMOCK_BASE}/rest/api/3/issue`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { ...forwardHeaders(req), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const contentType = (resp.headers && typeof resp.headers.get === 'function') ? resp.headers.get('content-type') : (resp.headers && resp.headers['content-type']) || '';
    const body = contentType && contentType.includes('application/json') ? await resp.json() : await resp.text();
    // forward status and body
    res.status(resp.status).send(body);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'bad gateway', detail: e.message });
  }
});

// Update issue
app.post('/mcp/update_issue', async (req, res) => {
  const key = req.body && req.body.issueKey;
  const payload = req.body && req.body.payload;
  if (!key) return res.status(400).json({ error: 'missing issueKey' });
  if (!payload) return res.status(400).json({ error: 'missing payload' });
  try {
    const url = `${WIREMOCK_BASE}/rest/api/3/issue/${encodeURIComponent(key)}`;
    const resp = await fetch(url, {
      method: 'PUT',
      headers: { ...forwardHeaders(req), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const contentType = (resp.headers && typeof resp.headers.get === 'function') ? resp.headers.get('content-type') : (resp.headers && resp.headers['content-type']) || '';
    const body = contentType && contentType.includes('application/json') ? await resp.json() : await resp.text();
    res.status(resp.status).send(body);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'bad gateway', detail: e.message });
  }
});

// Delete issue
app.post('/mcp/delete_issue', async (req, res) => {
  const key = req.body && req.body.issueKey;
  if (!key) return res.status(400).json({ error: 'missing issueKey' });
  try {
    const url = `${WIREMOCK_BASE}/rest/api/3/issue/${encodeURIComponent(key)}`;
    const resp = await fetch(url, { method: 'DELETE', headers: forwardHeaders(req) });
    // Some backends return empty body on delete. Try to parse JSON if present.
    const contentType = resp.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await resp.json() : '';
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
    const contentType = (resp.headers && typeof resp.headers.get === 'function') ? resp.headers.get('content-type') : (resp.headers && resp.headers['content-type']) || '';
    const body = contentType && contentType.includes('application/json') ? await resp.json() : await resp.text();
    res.status(resp.status).send(body);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'bad gateway', detail: e.message });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MCP router listening on ${PORT}, forwarding to ${WIREMOCK_BASE}`);
  });
}

module.exports = app;


