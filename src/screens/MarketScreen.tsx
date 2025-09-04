import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import StockService from '../services/StockService';
import { StockData, MarketIndex } from '../types/stock';

export default function MarketScreen() {
  const [selectedMarket, setSelectedMarket] = useState<'US' | 'HK'>('US');
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketData();
  }, [selectedMarket]);

  const loadMarketData = async () => {
    setLoading(true);
    try {
      const [stocksData, indicesData] = await Promise.all([
        StockService.getPopularStocks(selectedMarket),
        selectedMarket === 'US' 
          ? StockService.getUSMarketIndices() 
          : StockService.getHKMarketIndices()
      ]);
      
      setStocks(stocksData);
      setIndices(indicesData);
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading market data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Market Data</Text>
        
        <View style={styles.marketSelector}>
          <TouchableOpacity
            style={[styles.marketButton, selectedMarket === 'US' && styles.selectedMarket]}
            onPress={() => setSelectedMarket('US')}
          >
            <Text style={[styles.marketButtonText, selectedMarket === 'US' && styles.selectedMarketText]}>
              🇺🇸 US Market
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.marketButton, selectedMarket === 'HK' && styles.selectedMarket]}
            onPress={() => setSelectedMarket('HK')}
          >
            <Text style={[styles.marketButtonText, selectedMarket === 'HK' && styles.selectedMarketText]}>
              🇭🇰 HK Market
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stocks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.indicesContainer}>
        <Text style={styles.sectionTitle}>Market Indices</Text>
        <FlatList
          data={indices}
          renderItem={renderIndexItem}
          keyExtractor={(item) => item.symbol}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.indicesList}
        />
      </View>

      <View style={styles.stocksContainer}>
        <Text style={styles.sectionTitle}>Popular Stocks</Text>
        <FlatList
          data={stocks}
          renderItem={renderStockItem}
          keyExtractor={(item) => item.symbol}
          showsVerticalScrollIndicator={false}
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
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  marketSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  marketButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedMarket: {
    backgroundColor: 'white',
  },
  marketButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  selectedMarketText: {
    color: '#1e3a8a',
  },
  searchContainer: {
    padding: 20,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  indicesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 15,
  },
  indicesList: {
    marginBottom: 10,
  },
  indexItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  indexName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  indexPrice: {
    alignItems: 'flex-end',
  },
  stocksContainer: {
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
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
    color: '#1e3a8a',
    marginBottom: 4,
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
  },
});
