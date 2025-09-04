// Test setup file for Jest
// This file runs before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Use different port for testing

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to create mock request objects
  createMockRequest: (params = {}, body = {}, headers = {}) => ({
    params,
    body,
    headers,
    query: {},
    originalUrl: '/test',
  }),

  // Helper to create mock response objects
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  // Helper to create mock next function
  createMockNext: () => jest.fn(),

  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create test user data
  createTestUser: (overrides = {}) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'testpassword123',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    ...overrides
  }),

  // Helper to create test stock data
  createTestStock: (overrides = {}) => ({
    symbol: 'TEST',
    name: 'Test Company',
    price: 100.00,
    change: 5.00,
    changePercent: 5.26,
    volume: 1000000,
    market: 'US',
    lastUpdated: new Date().toISOString(),
    ...overrides
  }),

  // Helper to create test portfolio data
  createTestPortfolio: (overrides = {}) => ({
    id: 'test-portfolio-123',
    userId: 'test-user-123',
    name: 'Test Portfolio',
    totalValue: 10000.00,
    totalChange: 500.00,
    totalChangePercent: 5.26,
    holdings: [],
    transactions: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    ...overrides
  })
};

// Mock environment variables for testing
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: '3001',
  ALPHA_VANTAGE_API_KEY: 'test-key',
  YAHOO_FINANCE_API_KEY: 'test-key',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  CORS_ORIGIN: 'http://localhost:3000',
  LOG_LEVEL: 'error'
};

// Suppress specific warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

// Clean up after all tests
afterAll(() => {
  console.warn = originalWarn;
});

// Global beforeEach hook
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset environment
  process.env.NODE_ENV = 'test';
});

// Global afterEach hook
afterEach(() => {
  // Clean up any test data
  jest.restoreAllMocks();
});
