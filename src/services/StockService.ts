import { StockData, MarketIndex, StockQuote, CompanyInfo } from '../types/stock';

class StockService {
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getUSStockQuote(symbol: string): Promise<StockQuote> {
    // Simulate API call delay
    await this.delay(500);
    
    // Mock data for demo
    return {
      symbol,
      price: Math.random() * 1000 + 50,
      change: (Math.random() - 0.5) * 20,
      changePercent: (Math.random() - 0.5) * 10,
      volume: Math.floor(Math.random() * 1000000),
      marketCap: Math.random() * 1000000000,
      pe: Math.random() * 50 + 10,
      dividend: Math.random() * 5
    };
  }

  async getHKStockQuote(symbol: string): Promise<StockQuote> {
    await this.delay(500);
    
    return {
      symbol,
      price: Math.random() * 100 + 10,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 8,
      volume: Math.floor(Math.random() * 500000),
      marketCap: Math.random() * 500000000,
      pe: Math.random() * 30 + 8,
      dividend: Math.random() * 3
    };
  }

  async getPopularStocks(market: 'US' | 'HK'): Promise<StockData[]> {
    await this.delay(300);
    
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
    await this.delay(400);
    
    return [
      { name: 'S&P 500', symbol: '^GSPC', price: 4500 + Math.random() * 100, change: (Math.random() - 0.5) * 50, changePercent: (Math.random() - 0.5) * 2, market: 'US' },
      { name: 'Dow Jones', symbol: '^DJI', price: 35000 + Math.random() * 500, change: (Math.random() - 0.5) * 200, changePercent: (Math.random() - 0.5) * 1.5, market: 'US' },
      { name: 'NASDAQ', symbol: '^IXIC', price: 14000 + Math.random() * 300, change: (Math.random() - 0.5) * 150, changePercent: (Math.random() - 0.5) * 2.5, market: 'US' }
    ];
  }

  async getHKMarketIndices(): Promise<MarketIndex[]> {
    await this.delay(400);
    
    return [
      { name: 'Hang Seng', symbol: '^HSI', price: 18000 + Math.random() * 1000, change: (Math.random() - 0.5) * 300, changePercent: (Math.random() - 0.5) * 2, market: 'HK' },
      { name: 'Hang Seng Tech', symbol: '^HSTECH', price: 4000 + Math.random() * 200, change: (Math.random() - 0.5) * 100, changePercent: (Math.random() - 0.5) * 3, market: 'HK' }
    ];
  }

  async searchStocks(query: string, market: 'US' | 'HK'): Promise<StockData[]> {
    await this.delay(200);
    
    const allStocks = await this.getPopularStocks(market);
    return allStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getCompanyInfo(symbol: string, market: 'US' | 'HK'): Promise<CompanyInfo> {
    await this.delay(300);
    
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

export default new StockService();
