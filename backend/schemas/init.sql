-- Investment App Database Schema
-- This file initializes all tables, indexes, and constraints

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE market_type AS ENUM ('US', 'HK');
CREATE TYPE order_status AS ENUM ('pending', 'filled', 'cancelled', 'rejected');
CREATE TYPE order_type AS ENUM ('market', 'limit', 'stop', 'stop_limit');
CREATE TYPE position_type AS ENUM ('long', 'short');
CREATE TYPE alert_type AS ENUM ('price', 'volume', 'technical', 'portfolio');

-- ========================================
-- STOCK PRICE DATA SCHEMA
-- ========================================

-- Stock symbols and basic information
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    market market_type NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    exchange VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock price history (time-series data)
CREATE TABLE IF NOT EXISTS stock_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open_price DECIMAL(10,4) NOT NULL,
    high_price DECIMAL(10,4) NOT NULL,
    low_price DECIMAL(10,4) NOT NULL,
    close_price DECIMAL(10,4) NOT NULL,
    volume BIGINT NOT NULL,
    adjusted_close DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite unique constraint for stock and timestamp
    UNIQUE(stock_id, timestamp)
);

-- Real-time stock quotes (current prices)
CREATE TABLE IF NOT EXISTS stock_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    price DECIMAL(10,4) NOT NULL,
    change_amount DECIMAL(10,4) NOT NULL,
    change_percent DECIMAL(5,2) NOT NULL,
    volume BIGINT NOT NULL,
    market_cap BIGINT,
    pe_ratio DECIMAL(8,2),
    dividend_yield DECIMAL(5,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(stock_id)
);

-- ========================================
-- COMPANY INFORMATION SCHEMA
-- ========================================

-- Company profiles and details
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    founded_year INTEGER,
    employees_count INTEGER,
    headquarters VARCHAR(255),
    ceo VARCHAR(255),
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap BIGINT,
    enterprise_value BIGINT,
    revenue BIGINT,
    net_income BIGINT,
    debt BIGINT,
    cash BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(stock_id)
);

-- Company financial statements
CREATE TABLE IF NOT EXISTS financial_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    statement_type VARCHAR(20) NOT NULL, -- 'income', 'balance', 'cash_flow'
    period VARCHAR(10) NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4', 'annual'
    year INTEGER NOT NULL,
    quarter INTEGER,
    revenue DECIMAL(15,2),
    net_income DECIMAL(15,2),
    total_assets DECIMAL(15,2),
    total_liabilities DECIMAL(15,2),
    cash_flow_operations DECIMAL(15,2),
    filing_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, statement_type, period, year, quarter)
);

-- ========================================
-- MARKET INDICES SCHEMA
-- ========================================

-- Market indices (S&P 500, Dow Jones, Hang Seng, etc.)
CREATE TABLE IF NOT EXISTS market_indices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    market market_type NOT NULL,
    description TEXT,
    base_value DECIMAL(15,2),
    base_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index components (stocks that make up each index)
CREATE TABLE IF NOT EXISTS index_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    index_id UUID NOT NULL REFERENCES market_indices(id) ON DELETE CASCADE,
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    weight DECIMAL(5,4), -- Weight in the index (0.0001 to 1.0000)
    added_date DATE,
    removed_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(index_id, stock_id)
);

-- Index price history
CREATE TABLE IF NOT EXISTS index_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    index_id UUID NOT NULL REFERENCES market_indices(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    change_amount DECIMAL(15,2) NOT NULL,
    change_percent DECIMAL(8,4) NOT NULL,
    volume BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(index_id, timestamp)
);

-- ========================================
-- USER PORTFOLIO SCHEMA
-- ========================================

-- User portfolios
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Will reference users table when auth is implemented
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_value DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    total_gain_loss DECIMAL(15,2) DEFAULT 0,
    total_gain_loss_percent DECIMAL(8,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio positions (holdings)
CREATE TABLE IF NOT EXISTS portfolio_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    shares DECIMAL(10,4) NOT NULL,
    average_cost DECIMAL(10,4) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) NOT NULL,
    gain_loss DECIMAL(15,2) NOT NULL,
    gain_loss_percent DECIMAL(8,4) NOT NULL,
    position_type position_type DEFAULT 'long',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(portfolio_id, stock_id)
);

-- Portfolio transactions
CREATE TABLE IF NOT EXISTS portfolio_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'buy', 'sell', 'dividend', 'split'
    shares DECIMAL(10,4) NOT NULL,
    price_per_share DECIMAL(10,4) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    fees DECIMAL(10,2) DEFAULT 0,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ALERTS AND NOTIFICATIONS SCHEMA
-- ========================================

-- User alerts
CREATE TABLE IF NOT EXISTS user_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Will reference users table when auth is implemented
    stock_id UUID REFERENCES stocks(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    condition_type VARCHAR(20) NOT NULL, -- 'above', 'below', 'equals', 'change_percent'
    condition_value DECIMAL(15,4) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES user_alerts(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trigger_value DECIMAL(15,4) NOT NULL,
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- MARKET DATA CACHE SCHEMA
-- ========================================

-- API response cache for performance
CREATE TABLE IF NOT EXISTS api_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    response_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Stock price performance indexes
CREATE INDEX IF NOT EXISTS idx_stock_prices_stock_timestamp ON stock_prices(stock_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stock_prices_timestamp ON stock_prices(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stock_quotes_last_updated ON stock_quotes(last_updated DESC);

-- Company and stock indexes
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_stocks_market ON stocks(market);
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector);
CREATE INDEX IF NOT EXISTS idx_companies_stock_id ON companies(stock_id);

-- Market indices indexes
CREATE INDEX IF NOT EXISTS idx_market_indices_symbol ON market_indices(symbol);
CREATE INDEX IF NOT EXISTS idx_market_indices_market ON market_indices(market);
CREATE INDEX IF NOT EXISTS idx_index_prices_index_timestamp ON index_prices(index_id, timestamp DESC);

-- Portfolio performance indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_portfolio ON portfolio_positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_stock ON portfolio_positions(stock_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_portfolio ON portfolio_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_date ON portfolio_transactions(transaction_date DESC);

-- Alert indexes
CREATE INDEX IF NOT EXISTS idx_user_alerts_user ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_stock ON user_alerts(stock_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert ON alert_history(alert_id);

-- Cache performance indexes
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache(cache_key);

-- ========================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_indices_updated_at BEFORE UPDATE ON market_indices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_positions_updated_at BEFORE UPDATE ON portfolio_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_alerts_updated_at BEFORE UPDATE ON user_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SAMPLE DATA INSERTION
-- ========================================

-- Insert sample market indices
INSERT INTO market_indices (symbol, name, market, description) VALUES
('^GSPC', 'S&P 500', 'US', 'Standard & Poor''s 500 Index'),
('^DJI', 'Dow Jones Industrial Average', 'US', 'Dow Jones Industrial Average'),
('^IXIC', 'NASDAQ Composite', 'US', 'NASDAQ Composite Index'),
('^HSI', 'Hang Seng Index', 'HK', 'Hang Seng Index'),
('^HSTECH', 'Hang Seng Tech Index', 'HK', 'Hang Seng Technology Index')
ON CONFLICT (symbol) DO NOTHING;

-- Insert sample US stocks
INSERT INTO stocks (symbol, name, market, sector, industry) VALUES
('AAPL', 'Apple Inc.', 'US', 'Technology', 'Consumer Electronics'),
('GOOGL', 'Alphabet Inc.', 'US', 'Technology', 'Internet Services'),
('MSFT', 'Microsoft Corporation', 'US', 'Technology', 'Software'),
('AMZN', 'Amazon.com Inc.', 'US', 'Consumer Cyclical', 'Internet Retail'),
('TSLA', 'Tesla Inc.', 'US', 'Consumer Cyclical', 'Auto Manufacturers'),
('META', 'Meta Platforms Inc.', 'US', 'Technology', 'Internet Services'),
('NVDA', 'NVIDIA Corporation', 'US', 'Technology', 'Semiconductors'),
('NFLX', 'Netflix Inc.', 'US', 'Communication Services', 'Entertainment')
ON CONFLICT (symbol) DO NOTHING;

-- Insert sample HK stocks
INSERT INTO stocks (symbol, name, market, sector, industry) VALUES
('0700', 'Tencent Holdings Limited', 'HK', 'Technology', 'Internet Services'),
('0941', 'China Mobile Limited', 'HK', 'Communication Services', 'Telecom Services'),
('1299', 'AIA Group Limited', 'HK', 'Financial Services', 'Insurance'),
('2318', 'China Ping An Insurance', 'HK', 'Financial Services', 'Insurance'),
('3988', 'Industrial and Commercial Bank of China', 'HK', 'Financial Services', 'Banks')
ON CONFLICT (symbol) DO NOTHING;

-- Insert sample companies
INSERT INTO companies (stock_id, company_name, description, website, sector, industry) 
SELECT s.id, s.name, 'Leading technology company', 'https://example.com', s.sector, s.industry
FROM stocks s
WHERE s.symbol IN ('AAPL', 'GOOGL', 'MSFT', '0700')
ON CONFLICT (stock_id) DO NOTHING;

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for current stock prices with company info
CREATE OR REPLACE VIEW current_stock_prices AS
SELECT 
    s.symbol,
    s.name,
    s.market,
    s.sector,
    s.industry,
    sq.price,
    sq.change_amount,
    sq.change_percent,
    sq.volume,
    sq.last_updated
FROM stocks s
JOIN stock_quotes sq ON s.id = sq.stock_id
WHERE s.is_active = true;

-- View for portfolio summary
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT 
    p.id as portfolio_id,
    p.name as portfolio_name,
    p.total_value,
    p.total_cost,
    p.total_gain_loss,
    p.total_gain_loss_percent,
    COUNT(pp.id) as holdings_count,
    p.updated_at
FROM portfolios p
LEFT JOIN portfolio_positions pp ON p.id = pp.portfolio_id
GROUP BY p.id, p.name, p.total_value, p.total_cost, p.total_gain_loss, p.total_gain_loss_percent, p.updated_at;

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE stocks IS 'Stock symbols and basic information for US and HK markets';
COMMENT ON TABLE stock_prices IS 'Historical stock price data for technical analysis';
COMMENT ON TABLE stock_quotes IS 'Real-time stock quotes and current market data';
COMMENT ON TABLE companies IS 'Detailed company information and financial metrics';
COMMENT ON TABLE market_indices IS 'Market indices like S&P 500, Dow Jones, Hang Seng';
COMMENT ON TABLE portfolios IS 'User investment portfolios';
COMMENT ON TABLE portfolio_positions IS 'Individual stock holdings within portfolios';
COMMENT ON TABLE user_alerts IS 'User-defined price and portfolio alerts';
COMMENT ON TABLE api_cache IS 'Cache for API responses to improve performance';

COMMENT ON COLUMN stock_prices.timestamp IS 'Timestamp of the price data (market time)';
COMMENT ON COLUMN stock_quotes.last_updated IS 'Last time the quote was updated';
COMMENT ON COLUMN portfolio_positions.shares IS 'Number of shares owned (can be fractional)';
COMMENT ON COLUMN user_alerts.condition_value IS 'Price or percentage value for alert trigger';
