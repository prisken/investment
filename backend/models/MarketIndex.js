const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MarketIndex = sequelize.define('MarketIndex', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  baseValue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'base_value',
    validate: {
      min: 0
    }
  },
  baseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'base_date'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'market_indices',
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
      fields: ['is_active']
    }
  ]
});

// Instance methods
MarketIndex.prototype.getCurrentValue = async function() {
  const IndexPrice = require('./IndexPrice');
  const price = await IndexPrice.findOne({
    where: { indexId: this.id },
    order: [['timestamp', 'DESC']]
  });
  return price ? price.value : null;
};

MarketIndex.prototype.getPriceHistory = async function(limit = 100) {
  const IndexPrice = require('./IndexPrice');
  return await IndexPrice.findAll({
    where: { indexId: this.id },
    order: [['timestamp', 'DESC']],
    limit
  });
};

MarketIndex.prototype.getComponents = async function() {
  const IndexComponent = require('./IndexComponent');
  const Stock = require('./Stock');
  
  return await IndexComponent.findAll({
    where: { 
      indexId: this.id,
      isActive: true
    },
    include: [{
      model: Stock,
      attributes: ['symbol', 'name', 'market']
    }],
    order: [['weight', 'DESC']]
  });
};

MarketIndex.prototype.getPerformance = async function(days = 30) {
  const IndexPrice = require('./IndexPrice');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const prices = await IndexPrice.findAll({
    where: { 
      indexId: this.id,
      timestamp: {
        [sequelize.Op.gte]: startDate
      }
    },
    order: [['timestamp', 'ASC']]
  });
  
  if (prices.length < 2) return null;
  
  const firstPrice = prices[0].value;
  const lastPrice = prices[prices.length - 1].value;
  const change = lastPrice - firstPrice;
  const changePercent = (change / firstPrice) * 100;
  
  return {
    startValue: firstPrice,
    endValue: lastPrice,
    change,
    changePercent,
    days,
    prices
  };
};

// Class methods
MarketIndex.findBySymbol = function(symbol) {
  return this.findOne({
    where: { symbol: symbol.toUpperCase() }
  });
};

MarketIndex.findByMarket = function(market) {
  return this.findAll({
    where: { 
      market: market.toUpperCase(),
      isActive: true
    },
    order: [['symbol', 'ASC']]
  });
};

MarketIndex.getActiveIndices = function() {
  return this.findAll({
    where: { isActive: true },
    order: [['market', 'ASC'], ['symbol', 'ASC']]
  });
};

MarketIndex.updateIndexValue = async function(symbol, value, changeAmount, changePercent, volume = null) {
  const index = await this.findBySymbol(symbol);
  if (!index) {
    throw new Error(`Market index with symbol ${symbol} not found`);
  }
  
  const IndexPrice = require('./IndexPrice');
  await IndexPrice.create({
    indexId: index.id,
    value,
    changeAmount,
    changePercent,
    volume,
    timestamp: new Date()
  });
  
  return index;
};

MarketIndex.getMarketOverview = async function() {
  const indices = await this.getActiveIndices();
  const overview = {
    us: [],
    hk: []
  };
  
  for (const index of indices) {
    const currentValue = await index.getCurrentValue();
    const performance = await index.getPerformance(1); // 1 day performance
    
    const indexData = {
      symbol: index.symbol,
      name: index.name,
      value: currentValue,
      change: performance ? performance.change : 0,
      changePercent: performance ? performance.changePercent : 0,
      market: index.market
    };
    
    if (index.market === 'US') {
      overview.us.push(indexData);
    } else {
      overview.hk.push(indexData);
    }
  }
  
  return overview;
};

// Hooks
MarketIndex.beforeCreate((index, options) => {
  index.symbol = index.symbol.toUpperCase();
  if (index.market) {
    index.market = index.market.toUpperCase();
  }
});

MarketIndex.beforeUpdate((index, options) => {
  if (index.changed('symbol')) {
    index.symbol = index.symbol.toUpperCase();
  }
  if (index.changed('market')) {
    index.market = index.market.toUpperCase();
  }
});

module.exports = MarketIndex;
