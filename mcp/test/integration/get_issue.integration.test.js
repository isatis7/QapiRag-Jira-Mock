const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const MCP_URL = process.env.MCP_URL || 'http://localhost:3000';
const FIXTURE_PATH = path.resolve(__dirname, '../../../__files/ticket-QAPI-123.json');

// Skip integration tests unless explicitly enabled
if (process.env.INTEGRATION !== 'true') {
  test.skip('integration tests disabled (set INTEGRATION=true to enable)', () => {});
} else {
  jest.setTimeout(20000);

  test('MCP get_issue forwards to WireMock and returns fixture for QAPI-123', async () => {
    const expected = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

    const resp = await fetch(`${MCP_URL}/mcp/get_issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy'
      },
      body: JSON.stringify({ issueKey: 'QAPI-123' })
    });

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body).toEqual(expected);
  });
}

