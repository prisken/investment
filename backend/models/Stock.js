const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Stock = sequelize.define('Stock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  symbol: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 20],
      notEmpty: true
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255],
      notEmpty: true
    }
  },
  market: {
    type: DataTypes.ENUM('US', 'HK'),
    allowNull: false,
    validate: {
      isIn: [['US', 'HK']]
    }
  },
  sector: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  industry: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  exchange: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD',
    validate: {
      len: [3, 3],
      isIn: [['USD', 'HKD', 'CNY']]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'stocks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['symbol']
    },
    {
      fields: ['market']
    },
    {
      fields: ['sector']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Instance methods
Stock.prototype.getCurrentPrice = async function() {
  const StockQuote = require('./StockQuote');
  const quote = await StockQuote.findOne({
    where: { stockId: this.id }
  });
  return quote ? quote.price : null;
};

Stock.prototype.getPriceHistory = async function(limit = 100) {
  const StockPrice = require('./StockPrice');
  return await StockPrice.findAll({
    where: { stockId: this.id },
    order: [['timestamp', 'DESC']],
    limit
  });
};

Stock.prototype.getCompanyInfo = async function() {
  const Company = require('./Company');
  return await Company.findOne({
    where: { stockId: this.id }
  });
};

// Class methods
Stock.findBySymbol = function(symbol) {
  return this.findOne({
    where: { symbol: symbol.toUpperCase() }
  });
};

Stock.findByMarket = function(market) {
  return this.findAll({
    where: { 
      market: market.toUpperCase(),
      isActive: true
    },
    order: [['symbol', 'ASC']]
  });
};

Stock.findBySector = function(sector) {
  return this.findAll({
    where: { 
      sector: sector,
      isActive: true
    },
    order: [['symbol', 'ASC']]
  });
};

Stock.search = function(query, market = null) {
  const whereClause = {
    isActive: true,
    [sequelize.Op.or]: [
      { symbol: { [sequelize.Op.iLike]: `%${query}%` } },
      { name: { [sequelize.Op.iLike]: `%${query}%` } }
    ]
  };

  if (market) {
    whereClause.market = market.toUpperCase();
  }

  return this.findAll({
    where: whereClause,
    order: [['symbol', 'ASC']],
    limit: 50
  });
};

// Hooks
Stock.beforeCreate((stock, options) => {
  stock.symbol = stock.symbol.toUpperCase();
  if (stock.market) {
    stock.market = stock.market.toUpperCase();
  }
});

Stock.beforeUpdate((stock, options) => {
  if (stock.changed('symbol')) {
    stock.symbol = stock.symbol.toUpperCase();
  }
  if (stock.changed('market')) {
    stock.market = stock.market.toUpperCase();
  }
});

module.exports = Stock;
