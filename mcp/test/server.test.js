const request = require('supertest');
const app = require('../server');

describe('MCP basic endpoints', () => {
  beforeEach(() => {
    // reset global.fetch mock
    global.fetch = jest.fn();
  });

  test('health endpoint does not require auth', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'UP' });
  });

  test('get_issue forwards to WireMock and returns JSON', async () => {
    // mock WireMock response
    const mockBody = { id: '100', key: 'QAPI-123', fields: { summary: 'Test' } };
    global.fetch.mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => mockBody
    });

    const res = await request(app)
      .post('/mcp/get_issue')
      .set('Authorization', 'Bearer dummy')
      .send({ issueKey: 'QAPI-123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockBody);
    expect(global.fetch).toHaveBeenCalled();
  });

  test('create_issue proxies POST body', async () => {
    const created = { id: '200', key: 'QAPI-200' };
    global.fetch.mockResolvedValue({
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => created
    });

    const payload = { fields: { summary: 'New' } };
    const res = await request(app)
      .post('/mcp/create_issue')
      .set('Authorization', 'Bearer editor')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  test('update_issue requires issueKey and payload', async () => {
    let res = await request(app)
      .post('/mcp/update_issue')
      .set('Authorization', 'Bearer editor')
      .send({});
    expect(res.status).toBe(400);

    res = await request(app)
      .post('/mcp/update_issue')
      .set('Authorization', 'Bearer editor')
      .send({ issueKey: 'QAPI-123', payload: { fields: { summary: 'Updated' } } });

    expect(global.fetch).toHaveBeenCalled();
  });

  test('delete_issue forwards to WireMock', async () => {
    global.fetch.mockResolvedValue({ status: 204, headers: { get: () => '' }, text: async () => '' });

    const res = await request(app)
      .post('/mcp/delete_issue')
      .set('Authorization', 'Bearer admin')
      .send({ issueKey: 'QAPI-123' });

    expect(res.status).toBe(204);
  });
});

