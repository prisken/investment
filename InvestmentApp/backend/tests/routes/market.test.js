const request = require('supertest');
const express = require('express');
const marketRoutes = require('../../routes/market');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/market', marketRoutes);

describe('Market Routes', () => {
  describe('GET /api/market/indices/us', () => {
    it('should return US market indices', async () => {
      const response = await request(app)
        .get('/api/market/indices/us')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.timestamp).toBeDefined();

      // Check first index structure
      const firstIndex = response.body.data[0];
      expect(firstIndex).toHaveProperty('symbol');
      expect(firstIndex).toHaveProperty('name');
      expect(firstIndex).toHaveProperty('price');
      expect(firstIndex).toHaveProperty('change');
      expect(firstIndex).toHaveProperty('changePercent');
      expect(firstIndex).toHaveProperty('market');
      expect(firstIndex).toHaveProperty('lastUpdated');
      expect(firstIndex.market).toBe('US');
    });
  });

  describe('GET /api/market/indices/hk', () => {
    it('should return HK market indices', async () => {
      const response = await request(app)
        .get('/api/market/indices/hk')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.timestamp).toBeDefined();

      // Check first index structure
      const firstIndex = response.body.data[0];
      expect(firstIndex).toHaveProperty('symbol');
      expect(firstIndex).toHaveProperty('name');
      expect(firstIndex).toHaveProperty('price');
      expect(firstIndex).toHaveProperty('change');
      expect(firstIndex).toHaveProperty('changePercent');
      expect(firstIndex).toHaveProperty('market');
      expect(firstIndex).toHaveProperty('lastUpdated');
      expect(firstIndex.market).toBe('HK');
    });
  });
});
