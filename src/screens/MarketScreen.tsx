import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import StockService from '../services/StockService';
import { StockData, MarketIndex } from '../types/stock';

export default function MarketScreen() {
  const [selectedMarket, setSelectedMarket] = useState<'US' | 'HK'>('US');
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Create instance of StockService
  const stockService = new StockService();

  const loadMarketData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      const [stocksData, indicesData] = await Promise.all([
        stockService.getPopularStocks(selectedMarket),
        selectedMarket === 'US' 
          ? stockService.getUSMarketIndices() 
          : stockService.getHKMarketIndices()
      ]);
      
      setStocks(stocksData);
      setIndices(indicesData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading market data:', error);
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMarketData();
  }, [selectedMarket]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        loadMarketData(true);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading, refreshing, loadMarketData]);

  const handleRefresh = () => {
    loadMarketData(true);
  };

  const handleMarketChange = (market: 'US' | 'HK') => {
    setSelectedMarket(market);
    setSearchQuery(''); // Clear search when changing markets
  };

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStockItem = ({ item }: { item: StockData }) => (
    <View style={styles.stockItem}>
      <View style={styles.stockInfo}>
        <Text style={styles.stockSymbol}>{item.symbol}</Text>
        <Text style={styles.stockName}>{item.name}</Text>
      </View>
      <View style={styles.stockPrice}>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <Text style={[
          styles.change, 
          { color: item.change >= 0 ? '#10b981' : '#ef4444' }
        ]}>
          {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
        </Text>
        <Text style={styles.volume}>Vol: {item.volume.toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderIndexItem = ({ item }: { item: MarketIndex }) => (
    <View style={styles.indexItem}>
      <Text style={styles.indexName}>{item.name}</Text>
      <View style={styles.indexPrice}>
        <Text style={styles.price}>{item.price.toFixed(2)}</Text>
        <Text style={[
          styles.change, 
          { color: item.change >= 0 ? '#10b981' : '#ef4444' }
        ]}>
          {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
        </Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading real-time market data...</Text>
        <Text style={styles.loadingSubtext}>Connecting to live market feeds...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Market Data</Text>
        
        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Text>
        )}
        
        <View style={styles.marketSelector}>
          <TouchableOpacity
            style={[styles.marketButton, selectedMarket === 'US' && styles.selectedMarket]}
            onPress={() => handleMarketChange('US')}
          >
            <Text style={[styles.marketButtonText, selectedMarket === 'US' && styles.selectedMarketText]}>
              🇺🇸 US Market
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.marketButton, selectedMarket === 'HK' && styles.selectedMarket]}
            onPress={() => handleMarketChange('HK')}
          >
            <Text style={[styles.marketButtonText, selectedMarket === 'HK' && styles.selectedMarketText]}>
              🇭🇰 HK Market
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadMarketData()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${selectedMarket} stocks...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.indicesSection}>
        <Text style={styles.sectionTitle}>Market Indices</Text>
        <FlatList
          data={indices}
          renderItem={renderIndexItem}
          keyExtractor={(item) => item.symbol}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.indicesList}
        />
      </View>

      <View style={styles.stocksSection}>
        <Text style={styles.sectionTitle}>Popular Stocks</Text>
        <FlatList
          data={filteredStocks}
          renderItem={renderStockItem}
          keyExtractor={(item) => item.symbol}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No stocks found matching your search.' : 'No stocks available.'}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  lastUpdate: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  marketSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  marketButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedMarket: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'white',
  },
  marketButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedMarketText: {
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchInput: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  indicesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  indicesList: {
    paddingRight: 20,
  },
  indexItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  indexName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  indexPrice: {
    alignItems: 'flex-end',
  },
  stocksSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stockItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  stockName: {
    fontSize: 14,
    color: '#666',
  },
  stockPrice: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  volume: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
