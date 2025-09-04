// Mock storage utility for development
// This provides persistent in-memory storage across HTTP requests

class MockStorage {
  constructor() {
    this.users = new Map();
    this.userIdCounter = 1;
    this.portfolios = new Map();
    this.transactions = new Map();
    this.marketData = new Map();
  }

  // User management
  createUser(userData) {
    const { email, password, name, role = 'user' } = userData;
    
    if (this.users.has(email)) {
      return null; // User already exists
    }

    const user = {
      id: this.userIdCounter++,
      email,
      name,
      password,
      role,
      preferences: {},
      subscription: { plan: 'free', features: [] },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    };

    this.users.set(email, user);
    return user;
  }

  findUserByEmail(email) {
    return this.users.get(email) || null;
  }

  findUserById(id) {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }

  updateUserLastLogin(userId) {
    const user = this.findUserById(userId);
    if (user) {
      user.last_login = new Date().toISOString();
      user.updated_at = new Date().toISOString();
    }
  }

  updateUserPreferences(userId, preferences) {
    const user = this.findUserById(userId);
    if (user) {
      user.preferences = { ...user.preferences, ...preferences };
      user.updated_at = new Date().toISOString();
      return user;
    }
    return null;
  }

  updateUserSubscription(userId, subscription) {
    const user = this.findUserById(userId);
    if (user) {
      user.subscription = { ...user.subscription, ...subscription };
      user.updated_at = new Date().toISOString();
      return user;
    }
    return null;
  }

  deactivateUser(userId) {
    const user = this.findUserById(userId);
    if (user) {
      user.is_active = false;
      user.updated_at = new Date().toISOString();
      return user;
    }
    return null;
  }

  getAllUsers(limit = 100, offset = 0) {
    const users = Array.from(this.users.values())
      .slice(offset, offset + limit)
      .map(user => ({ ...user, password: undefined }));
    
    return {
      users,
      count: users.length,
      total: this.users.size
    };
  }

  // Portfolio management
  createPortfolio(portfolioData) {
    const { userId, name, description } = portfolioData;
    
    const portfolio = {
      id: `portfolio-${Date.now()}`,
      userId,
      name,
      description,
      totalValue: 0,
      totalChange: 0,
      totalChangePercent: 0,
      holdings: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isActive: true
    };

    this.portfolios.set(portfolio.id, portfolio);
    return portfolio;
  }

  findPortfolioByUserId(userId) {
    for (const portfolio of this.portfolios.values()) {
      if (portfolio.userId === userId && portfolio.isActive) {
        return portfolio;
      }
    }
    return null;
  }

  // Transaction management
  createTransaction(transactionData) {
    const { portfolioId, type, symbol, shares, price, market } = transactionData;
    
    const transaction = {
      id: `txn-${Date.now()}`,
      portfolioId,
      type,
      symbol,
      shares,
      price,
      total: shares * price,
      market,
      timestamp: new Date().toISOString(),
      fees: 0
    };

    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  getTransactionsByPortfolio(portfolioId) {
    return Array.from(this.transactions.values())
      .filter(tx => tx.portfolioId === portfolioId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Market data cache
  setMarketData(symbol, data) {
    this.marketData.set(symbol, {
      ...data,
      lastUpdated: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });
  }

  getMarketData(symbol) {
    const data = this.marketData.get(symbol);
    if (data && new Date() < new Date(data.expiresAt)) {
      return data;
    }
    return null;
  }

  // Debug and status
  getStatus() {
    return {
      users: this.users.size,
      portfolios: this.portfolios.size,
      transactions: this.transactions.size,
      marketData: this.marketData.size,
      uptime: new Date().toISOString()
    };
  }

  // Clear all data (for testing)
  clear() {
    this.users.clear();
    this.portfolios.clear();
    this.transactions.clear();
    this.marketData.clear();
    this.userIdCounter = 1;
  }
}

// Create a singleton instance
const mockStorage = new MockStorage();

module.exports = mockStorage;

