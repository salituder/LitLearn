const request = require('supertest');
const app = require('../app');

describe('POST /api/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'test@example.com', password: '123456' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('userId');
  });
});