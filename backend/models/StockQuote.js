const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockQuote = sequelize.define('StockQuote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  stockId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stocks',
      key: 'id'
    },
    field: 'stock_id'
  },
  price: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    validate: {
      min: 0,
      notNull: true
    }
  },
  changeAmount: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    field: 'change_amount'
  },
  changePercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'change_percent'
  },
  volume: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate: {
      min: 0,
      notNull: true
    }
  },
  marketCap: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'market_cap'
  },
  peRatio: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    field: 'pe_ratio',
    validate: {
      min: 0
    }
  },
  dividendYield: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'dividend_yield',
    validate: {
      min: 0,
      max: 100
    }
  },
  lastUpdated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_updated'
  }
}, {
  tableName: 'stock_quotes',
  timestamps: false,
  indexes: [
    {
      fields: ['stock_id'],
      unique: true
    },
    {
      fields: ['last_updated']
    }
  ]
});

// Instance methods
StockQuote.prototype.getFormattedPrice = function() {
  return `$${this.price.toFixed(2)}`;
};

StockQuote.prototype.getFormattedChange = function() {
  const sign = this.changeAmount >= 0 ? '+' : '';
  return `${sign}$${this.changeAmount.toFixed(2)} (${sign}${this.changePercent.toFixed(2)}%)`;
};

StockQuote.prototype.isPositive = function() {
  return this.changeAmount >= 0;
};

StockQuote.prototype.getMarketCapFormatted = function() {
  if (!this.marketCap) return 'N/A';
  
  if (this.marketCap >= 1e12) {
    return `$${(this.marketCap / 1e12).toFixed(2)}T`;
  } else if (this.marketCap >= 1e9) {
    return `$${(this.marketCap / 1e9).toFixed(2)}B`;
  } else if (this.marketCap >= 1e6) {
    return `$${(this.marketCap / 1e6).toFixed(2)}M`;
  } else {
    return `$${this.marketCap.toLocaleString()}`;
  }
};

// Class methods
StockQuote.findByStockId = function(stockId) {
  return this.findOne({
    where: { stockId }
  });
};

StockQuote.findBySymbol = async function(symbol) {
  const Stock = require('./Stock');
  const stock = await Stock.findBySymbol(symbol);
  if (!stock) return null;
  
  return await this.findOne({
    where: { stockId: stock.id }
  });
};

StockQuote.findByMarket = async function(market) {
  const Stock = require('./Stock');
  const stocks = await Stock.findByMarket(market);
  const stockIds = stocks.map(stock => stock.id);
  
  return await this.findAll({
    where: { stockId: stockIds },
    include: [{
      model: Stock,
      attributes: ['symbol', 'name', 'market']
    }],
    order: [['lastUpdated', 'DESC']]
  });
};

StockQuote.updateQuote = async function(stockId, quoteData) {
  const [quote, created] = await this.findOrCreate({
    where: { stockId },
    defaults: {
      ...quoteData,
      lastUpdated: new Date()
    }
  });

  if (!created) {
    await quote.update({
      ...quoteData,
      lastUpdated: new Date()
    });
  }

  return quote;
};

StockQuote.getTopGainers = async function(market = null, limit = 10) {
  const Stock = require('./Stock');
  const whereClause = {};
  
  if (market) {
    const stocks = await Stock.findByMarket(market);
    whereClause.stockId = stocks.map(stock => stock.id);
  }

  return await this.findAll({
    where: whereClause,
    include: [{
      model: Stock,
      attributes: ['symbol', 'name', 'market']
    }],
    order: [['changePercent', 'DESC']],
    limit
  });
};

StockQuote.getTopLosers = async function(market = null, limit = 10) {
  const Stock = require('./Stock');
  const whereClause = {};
  
  if (market) {
    const stocks = await Stock.findByMarket(market);
    whereClause.stockId = stocks.map(stock => stock.id);
  }

  return await this.findAll({
    where: whereClause,
    include: [{
      model: Stock,
      attributes: ['symbol', 'name', 'market']
    }],
    order: [['changePercent', 'ASC']],
    limit
  });
};

StockQuote.getMostActive = async function(market = null, limit = 10) {
  const Stock = require('./Stock');
  const whereClause = {};
  
  if (market) {
    const stocks = await Stock.findByMarket(market);
    whereClause.stockId = stocks.map(stock => stock.id);
  }

  return await this.findAll({
    where: whereClause,
    include: [{
      model: Stock,
      attributes: ['symbol', 'name', 'market']
    }],
    order: [['volume', 'DESC']],
    limit
  });
};

// Hooks
StockQuote.beforeCreate((quote, options) => {
  quote.lastUpdated = new Date();
});

StockQuote.beforeUpdate((quote, options) => {
  quote.lastUpdated = new Date();
});

module.exports = StockQuote;
