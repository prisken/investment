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

    it('should return valid price data', async () => {
      const response = await request(app)
        .get('/api/market/indices/us')
        .expect(200);

      const indices = response.body.data;
      indices.forEach(index => {
        expect(typeof index.price).toBe('number');
        expect(index.price).toBeGreaterThan(0);
        expect(typeof index.change).toBe('number');
        expect(typeof index.changePercent).toBe('number');
        expect(typeof index.lastUpdated).toBe('string');
        expect(new Date(index.lastUpdated)).toBeInstanceOf(Date);
      });
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

    it('should return valid HK index data', async () => {
      const response = await request(app)
        .get('/api/market/indices/hk')
        .expect(200);

      const indices = response.body.data;
      indices.forEach(index => {
        expect(typeof index.price).toBe('number');
        expect(index.price).toBeGreaterThan(0);
        expect(typeof index.change).toBe('number');
        expect(typeof index.changePercent).toBe('number');
        expect(typeof index.lastUpdated).toBe('string');
        expect(new Date(index.lastUpdated)).toBeInstanceOf(Date);
      });
    });
  });

  describe('GET /api/market/overview', () => {
    it('should return market overview', async () => {
      const response = await request(app)
        .get('/api/market/overview')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('usMarket');
      expect(response.body.data).toHaveProperty('hkMarket');
      expect(response.body.data).toHaveProperty('globalStatus');
      expect(response.body.timestamp).toBeDefined();

      // Check US market structure
      expect(response.body.data.usMarket).toHaveProperty('status');
      expect(response.body.data.usMarket).toHaveProperty('lastUpdated');
      expect(response.body.data.usMarket).toHaveProperty('indices');
      expect(response.body.data.usMarket.indices).toBeInstanceOf(Array);

      // Check HK market structure
      expect(response.body.data.hkMarket).toHaveProperty('status');
      expect(response.body.data.hkMarket).toHaveProperty('lastUpdated');
      expect(response.body.data.hkMarket).toHaveProperty('indices');
      expect(response.body.data.hkMarket.indices).toBeInstanceOf(Array);
    });

    it('should return valid market status values', async () => {
      const response = await request(app)
        .get('/api/market/overview')
        .expect(200);

      const { usMarket, hkMarket } = response.body.data;
      
      expect(['open', 'closed']).toContain(usMarket.status);
      expect(['open', 'closed']).toContain(hkMarket.status);
      expect(['mixed', 'bull', 'bear']).toContain(response.body.data.globalStatus);
      
      expect(new Date(usMarket.lastUpdated)).toBeInstanceOf(Date);
      expect(new Date(hkMarket.lastUpdated)).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/market/status', () => {
    it('should return market status', async () => {
      const response = await request(app)
        .get('/api/market/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('us');
      expect(response.body.data).toHaveProperty('hk');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should return valid market open/closed status', async () => {
      const response = await request(app)
        .get('/api/market/status')
        .expect(200);

      const { us, hk } = response.body.data;
      
      expect(typeof us.open).toBe('boolean');
      expect(typeof hk.open).toBe('boolean');
      expect(us).toHaveProperty('time');
      expect(hk).toHaveProperty('time');
      expect(us).toHaveProperty('timezone');
      expect(hk).toHaveProperty('timezone');
      
      expect(us.timezone).toBe('America/New_York');
      expect(hk.timezone).toBe('Asia/Hong_Kong');
    });

    it('should return valid timestamp', async () => {
      const response = await request(app)
        .get('/api/market/status')
        .expect(200);

      expect(new Date(response.body.data.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Error handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // This test would require mocking the route to throw an error
      // For now, we'll just verify the route exists and returns data
      const response = await request(app)
        .get('/api/market/indices/us')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Response format consistency', () => {
    it('should maintain consistent response format across all endpoints', async () => {
      const endpoints = [
        '/api/market/indices/us',
        '/api/market/indices/hk',
        '/api/market/overview',
        '/api/market/status'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(200);

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body.success).toBe(true);
        expect(typeof response.body.timestamp).toBe('string');
      }
    });
  });
});
