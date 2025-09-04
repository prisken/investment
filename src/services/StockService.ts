import { StockData, MarketIndex, StockQuote, CompanyInfo } from '../types/stock';

class StockService {
  private baseUrl = 'http://localhost:3000/api';
  
  private async makeRequest(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getUSStockQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await this.makeRequest(`/market/enhanced/quote/${symbol}`);
      if (response.success) {
        return {
          symbol: response.data.symbol,
          price: response.data.price,
          change: response.data.change,
          changePercent: response.data.changePercent,
          volume: response.data.volume || 0,
          marketCap: response.data.marketCap || 0,
          pe: response.data.pe || 0,
          dividend: response.data.dividend || 0
        };
      } else {
        throw new Error(response.error?.message || 'Failed to fetch stock quote');
      }
    } catch (error) {
      console.error(`Error fetching US stock quote for ${symbol}:`, error);
      throw error;
    }
  }

  async getHKStockQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await this.makeRequest(`/stocks/hk/${symbol}`);
      if (response.success) {
        return {
          symbol: response.data.symbol,
          price: response.data.price,
          change: response.data.change,
          changePercent: response.data.changePercent,
          volume: response.data.volume || 0,
          marketCap: response.data.marketCap || 0,
          pe: response.data.pe || 0,
          dividend: response.data.dividend || 0
        };
      } else {
        throw new Error(response.error?.message || 'Failed to fetch stock quote');
      }
    } catch (error) {
      console.error(`Error fetching HK stock quote for ${symbol}:`, error);
      throw error;
    }
  }

  async getPopularStocks(market: 'US' | 'HK'): Promise<StockData[]> {
    try {
      const response = await this.makeRequest(`/stocks/popular/${market}`);
      if (response.success) {
        return response.data.map((stock: any) => ({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume || 0,
          market
        }));
      } else {
        throw new Error(response.error?.message || 'Failed to fetch popular stocks');
      }
    } catch (error) {
      console.error(`Error fetching popular stocks for ${market}:`, error);
      // Fallback to mock data if API fails
      return this.getMockPopularStocks(market);
    }
  }

  private getMockPopularStocks(market: 'US' | 'HK'): StockData[] {
    const usStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    const hkStocks = ['0700', '0941', '0005', '1299', '2318', '3988', '1398', '2628'];
    
    const symbols = market === 'US' ? usStocks : hkStocks;
    
    return symbols.map(symbol => ({
      symbol,
      name: `${symbol} Company`,
      price: Math.random() * (market === 'US' ? 1000 : 100) + (market === 'US' ? 50 : 10),
      change: (Math.random() - 0.5) * (market === 'US' ? 20 : 5),
      changePercent: (Math.random() - 0.5) * (market === 'US' ? 10 : 8),
      volume: Math.floor(Math.random() * (market === 'US' ? 1000000 : 500000)),
      market
    }));
  }

  async getUSMarketIndices(): Promise<MarketIndex[]> {
    try {
      const response = await this.makeRequest('/market/indices/us');
      if (response.success) {
        return response.data.map((index: any) => ({
          name: index.name,
          symbol: index.symbol,
          price: index.price,
          change: index.change,
          changePercent: index.changePercent,
          market: 'US'
        }));
      } else {
        throw new Error(response.error?.message || 'Failed to fetch US market indices');
      }
    } catch (error) {
      console.error('Error fetching US market indices:', error);
      // Fallback to mock data if API fails
      return this.getMockUSIndices();
    }
  }

  async getHKMarketIndices(): Promise<MarketIndex[]> {
    try {
      const response = await this.makeRequest('/market/indices/hk');
      if (response.success) {
        return response.data.map((index: any) => ({
          name: index.name,
          symbol: index.symbol,
          price: index.price,
          change: index.change,
          changePercent: index.changePercent,
          market: 'HK'
        }));
      } else {
        throw new Error(response.error?.message || 'Failed to fetch HK market indices');
      }
    } catch (error) {
      console.error('Error fetching HK market indices:', error);
      // Fallback to mock data if API fails
      return this.getMockHKIndices();
    }
  }

  private getMockUSIndices(): MarketIndex[] {
    return [
      { name: 'S&P 500', symbol: '^GSPC', price: 4500 + Math.random() * 100, change: (Math.random() - 0.5) * 50, changePercent: (Math.random() - 0.5) * 2, market: 'US' },
      { name: 'Dow Jones', symbol: '^DJI', price: 35000 + Math.random() * 500, change: (Math.random() - 0.5) * 200, changePercent: (Math.random() - 0.5) * 1.5, market: 'US' },
      { name: 'NASDAQ', symbol: '^IXIC', price: 14000 + Math.random() * 300, change: (Math.random() - 0.5) * 150, changePercent: (Math.random() - 0.5) * 2.5, market: 'US' }
    ];
  }

  private getMockHKIndices(): MarketIndex[] {
    return [
      { name: 'Hang Seng', symbol: '^HSI', price: 18000 + Math.random() * 1000, change: (Math.random() - 0.5) * 300, changePercent: (Math.random() - 0.5) * 2, market: 'HK' },
      { name: 'Hang Seng Tech', symbol: '^HSTECH', price: 4000 + Math.random() * 200, change: (Math.random() - 0.5) * 100, changePercent: (Math.random() - 0.5) * 3, market: 'HK' }
    ];
  }

  async searchStocks(query: string, market: 'US' | 'HK'): Promise<StockData[]> {
    try {
      const response = await this.makeRequest(`/market/enhanced/search?q=${encodeURIComponent(query)}&market=${market}`);
      if (response.success) {
        return response.data.map((stock: any) => ({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume || 0,
          market
        }));
      } else {
        throw new Error(response.error?.message || 'Failed to search stocks');
      }
    } catch (error) {
      console.error(`Error searching stocks for ${query}:`, error);
      // Fallback to local search if API fails
      const allStocks = await this.getPopularStocks(market);
      return allStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  async getCompanyInfo(symbol: string, market: 'US' | 'HK'): Promise<CompanyInfo> {
    try {
      const response = await this.makeRequest(`/market/enhanced/company/${symbol}`);
      if (response.success) {
        return {
          name: response.data.name || `${symbol} Corporation`,
          sector: response.data.sector || 'Technology',
          industry: response.data.industry || 'Software',
          description: response.data.description || 'A leading technology company focused on innovation and growth.',
          website: response.data.website || 'https://example.com',
          employees: response.data.employees || Math.floor(Math.random() * 100000) + 1000,
          founded: response.data.founded || 1990 + Math.floor(Math.random() * 30)
        };
      } else {
        throw new Error(response.error?.message || 'Failed to fetch company info');
      }
    } catch (error) {
      console.error(`Error fetching company info for ${symbol}:`, error);
      // Fallback to mock data if API fails
      return {
        name: `${symbol} Corporation`,
        sector: 'Technology',
        industry: 'Software',
        description: 'A leading technology company focused on innovation and growth.',
        website: 'https://example.com',
        employees: Math.floor(Math.random() * 100000) + 1000,
        founded: 1990 + Math.floor(Math.random() * 30)
      };
    }
  }

  // New method to get real-time market overview
  async getMarketOverview(): Promise<any> {
    try {
      const response = await this.makeRequest('/market/enhanced/overview');
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch market overview');
      }
    } catch (error) {
      console.error('Error fetching market overview:', error);
      throw error;
    }
  }

  // New method to get batch quotes for multiple stocks
  async getBatchQuotes(symbols: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/market/enhanced/batch-quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error?.message || 'Failed to fetch batch quotes');
      }
    } catch (error) {
      console.error('Error fetching batch quotes:', error);
      throw error;
    }
  }
}

export default StockService;
