import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  source: string;
  timestamp: string;
}

interface StockPriceDisplayProps {
  symbol: string;
  onPress?: () => void;
  showDetails?: boolean;
  refreshInterval?: number;
}

const StockPriceDisplay: React.FC<StockPriceDisplayProps> = ({
  symbol,
  onPress,
  showDetails = false,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Animation values
  const priceAnimation = new Animated.Value(0);
  const changeAnimation = new Animated.Value(0);

  const fetchStockQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3000/api/market/enhanced/quote/${symbol}`);
      const data = await response.json();
      
      if (data.success) {
        const newQuote = data.data;
        
        // Animate price change
        if (quote && quote.price !== newQuote.price) {
          Animated.sequence([
            Animated.timing(priceAnimation, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(priceAnimation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
        
        setQuote(newQuote);
        setLastUpdate(new Date());
      } else {
        setError(data.error?.message || 'Failed to fetch quote');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching stock quote:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockQuote();
    
    const interval = setInterval(fetchStockQuote, refreshInterval);
    return () => clearInterval(interval);
  }, [symbol, refreshInterval]);

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const formatChangePercent = (changePercent: number) => {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(1)}B`;
    } else if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return '#00C851';
    if (change < 0) return '#FF4444';
    return '#666666';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  if (loading && !quote) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading {symbol}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStockQuote}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!quote) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No data available</Text>
      </View>
    );
  }

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={styles.container} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.symbol}>{quote.symbol}</Text>
        <Text style={styles.source}>{quote.source}</Text>
      </View>

      {/* Main Price Display */}
      <View style={styles.priceContainer}>
        <Animated.View
          style={[
            styles.priceWrapper,
            {
              transform: [
                {
                  scale: priceAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.price}>${formatPrice(quote.price)}</Text>
        </Animated.View>
        
        <View style={styles.changeContainer}>
          <Text style={[styles.changeIcon, { color: getChangeColor(quote.change) }]}>
            {getChangeIcon(quote.change)}
          </Text>
          <Text style={[styles.change, { color: getChangeColor(quote.change) }]}>
            {formatChange(quote.change)}
          </Text>
          <Text style={[styles.changePercent, { color: getChangeColor(quote.change) }]}>
            {formatChangePercent(quote.changePercent)}
          </Text>
        </View>
      </View>

      {/* Additional Details */}
      {showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Open:</Text>
            <Text style={styles.detailValue}>${formatPrice(quote.open)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>High:</Text>
            <Text style={styles.detailValue}>${formatPrice(quote.high)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Low:</Text>
            <Text style={styles.detailValue}>${formatPrice(quote.low)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Volume:</Text>
            <Text style={styles.detailValue}>{formatVolume(quote.volume)}</Text>
          </View>
        </View>
      )}

      {/* Last Update */}
      <View style={styles.footer}>
        <Text style={styles.lastUpdate}>
          Last update: {lastUpdate?.toLocaleTimeString()}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchStockQuote}>
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  symbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  source: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  priceWrapper: {
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  change: {
    fontSize: 18,
    fontWeight: '600',
  },
  changePercent: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999999',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  errorText: {
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default StockPriceDisplay;
