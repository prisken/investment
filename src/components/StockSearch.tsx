import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from 'react-native';

interface StockSearchResult {
  symbol: string;
  name?: string;
  market?: string;
}

interface StockSearchProps {
  onStockSelect: (symbol: string) => void;
  placeholder?: string;
  showRecentSearches?: boolean;
  showPopularStocks?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const StockSearch: React.FC<StockSearchProps> = ({
  onStockSelect,
  placeholder = 'Search stocks...',
  showRecentSearches = true,
  showPopularStocks = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularStocks, setPopularStocks] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Popular US stocks
  const defaultPopularStocks: StockSearchResult[] = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
  ];

  useEffect(() => {
    // Load recent searches from storage
    loadRecentSearches();
    
    // Set default popular stocks
    setPopularStocks(defaultPopularStocks);
  }, []);

  const loadRecentSearches = async () => {
    try {
      // In a real app, you'd load from AsyncStorage
      const recent = ['AAPL', 'GOOGL', 'MSFT'];
      setRecentSearches(recent);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (symbol: string) => {
    try {
      const updated = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 10);
      setRecentSearches(updated);
      // In a real app, you'd save to AsyncStorage
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const performSearch = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:3000/api/market/enhanced/search?q=${encodeURIComponent(query)}&limit=20`
      );
      const data = await response.json();
      
      if (data.success) {
        const results = data.data.results.map((symbol: string) => ({
          symbol,
          name: getStockName(symbol),
          market: 'US',
        }));
        setSearchResults(results);
        setShowResults(true);
      } else {
        setError(data.error?.message || 'Search failed');
        setSearchResults([]);
      }
    } catch (err) {
      setError('Network error');
      setSearchResults([]);
      console.error('Error performing search:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStockName = (symbol: string): string => {
    const stock = defaultPopularStocks.find(s => s.symbol === symbol);
    return stock?.name || symbol;
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text);
    }, 300);
  };

  const handleStockSelect = (symbol: string) => {
    setSearchQuery(symbol);
    setShowResults(false);
    saveRecentSearch(symbol);
    onStockSelect(symbol);
    Keyboard.dismiss();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    searchInputRef.current?.focus();
  };

  const renderSearchResult = ({ item }: { item: StockSearchResult }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleStockSelect(item.symbol)}
    >
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultSymbol}>{item.symbol}</Text>
        {item.name && (
          <Text style={styles.searchResultName}>{item.name}</Text>
        )}
      </View>
      <Text style={styles.searchResultMarket}>{item.market}</Text>
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => handleStockSelect(item)}
    >
      <Text style={styles.recentSearchText}>{item}</Text>
      <Text style={styles.recentSearchLabel}>Recent</Text>
    </TouchableOpacity>
  );

  const renderPopularStock = ({ item }: { item: StockSearchResult }) => (
    <TouchableOpacity
      style={styles.popularStockItem}
      onPress={() => handleStockSelect(item.symbol)}
    >
      <Text style={styles.popularStockSymbol}>{item.symbol}</Text>
      {item.name && (
        <Text style={styles.popularStockName}>{item.name}</Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptySearch = () => (
    <View style={styles.emptySearchContainer}>
      <Text style={styles.emptySearchText}>No stocks found</Text>
      <Text style={styles.emptySearchSubtext}>
        Try searching for a different symbol or company name
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchInputContainer}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={handleSearchChange}
          onFocus={() => setShowResults(true)}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
        />
        
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearSearch}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
        
        {loading && (
          <ActivityIndicator
            style={styles.loadingIndicator}
            size="small"
            color="#007AFF"
          />
        )}
      </View>

      {/* Search Results */}
      {showResults && (
        <View style={styles.resultsContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : searchQuery.length > 0 ? (
            // Search Results
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.symbol}
              style={styles.resultsList}
              ListEmptyComponent={renderEmptySearch}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            // Recent Searches and Popular Stocks
            <View style={styles.suggestionsContainer}>
              {showRecentSearches && recentSearches.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <FlatList
                    data={recentSearches}
                    renderItem={renderRecentSearch}
                    keyExtractor={(item) => item}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.horizontalList}
                  />
                </View>
              )}
              
              {showPopularStocks && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Popular Stocks</Text>
                  <FlatList
                    data={popularStocks}
                    renderItem={renderPopularStock}
                    keyExtractor={(item) => item.symbol}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.horizontalList}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999999',
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6.27,
    elevation: 8,
  },
  resultsList: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  searchResultName: {
    fontSize: 14,
    color: '#666666',
  },
  searchResultMarket: {
    fontSize: 12,
    color: '#999999',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  suggestionsContainer: {
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
  },
  horizontalList: {
    marginHorizontal: -8,
  },
  recentSearchItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentSearchText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginRight: 8,
  },
  recentSearchLabel: {
    fontSize: 10,
    color: '#999999',
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularStockItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 80,
  },
  popularStockSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  popularStockName: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 12,
  },
  emptySearchContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
  },
});

export default StockSearch;
