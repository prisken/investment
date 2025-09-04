import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import webSocketService, { RealTimeStockUpdate } from '../services/WebSocketService';

interface RealTimeStockDisplayProps {
  symbol: string;
  initialPrice?: number;
  onPress?: () => void;
  showVolume?: boolean;
  showChange?: boolean;
  compact?: boolean;
}

const RealTimeStockDisplay: React.FC<RealTimeStockDisplayProps> = ({
  symbol,
  initialPrice = 0,
  onPress,
  showVolume = true,
  showChange = true,
  compact = false,
}) => {
  const [stockData, setStockData] = useState<RealTimeStockUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Animation values
  const priceAnimation = useRef(new Animated.Value(0)).current;
  const changeAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const flashAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Set initial price
    if (initialPrice > 0) {
      priceAnimation.setValue(initialPrice);
    }

    // Connect to WebSocket
    const connectWebSocket = async () => {
      try {
        await webSocketService.connect();
        setIsConnected(true);
        
        // Subscribe to this stock
        webSocketService.subscribeToStocks([symbol]);
        
        // Listen for updates
        webSocketService.on('stock-update', handleStockUpdate);
        webSocketService.on('connection-status', handleConnectionStatus);
        webSocketService.on('error', handleError);
        
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      // Cleanup
      webSocketService.off('stock-update', handleStockUpdate);
      webSocketService.off('connection-status', handleConnectionStatus);
      webSocketService.off('error', handleError);
      webSocketService.unsubscribeFromStocks([symbol]);
    };
  }, [symbol]);

  const handleStockUpdate = (data: RealTimeStockUpdate) => {
    if (data.symbol === symbol) {
      setIsUpdating(true);
      
      // Animate price change
      Animated.timing(priceAnimation, {
        toValue: data.price,
        duration: 500,
        useNativeDriver: false,
      }).start();

      // Animate change indicator
      Animated.sequence([
        Animated.timing(changeAnimation, {
          toValue: data.change,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(changeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();

      // Flash effect for price updates
      Animated.sequence([
        Animated.timing(flashAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(flashAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();

      // Pulse effect
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setStockData(data);
      setLastUpdate(new Date());
      
      setTimeout(() => setIsUpdating(false), 1000);
    }
  };

  const handleConnectionStatus = (status: 'connected' | 'disconnected' | 'error') => {
    setIsConnected(status === 'connected');
  };

  const handleError = (error: string) => {
    console.error('WebSocket error:', error);
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
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
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return '#10b981'; // Green
    if (change < 0) return '#ef4444'; // Red
    return '#6b7280'; // Gray
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  const getConnectionStatusColor = () => {
    if (isConnected) return '#10b981';
    if (isUpdating) return '#f59e0b';
    return '#ef4444';
  };

  const getConnectionStatusText = () => {
    if (isConnected && !isUpdating) return '●';
    if (isUpdating) return '⟳';
    return '●';
  };

  const currentPrice = stockData?.price || initialPrice;
  const currentChange = stockData?.change || 0;
  const currentChangePercent = stockData?.changePercent || 0;
  const currentVolume = stockData?.volume || 0;

  const StockCard = (
    <Animated.View 
      style={[
        styles.container,
        compact && styles.compactContainer,
        {
          transform: [{ scale: pulseAnimation }],
          backgroundColor: flashAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['#ffffff', '#f0f9ff'],
          }),
        }
      ]}
    >
      <TouchableOpacity 
        onPress={onPress}
        style={styles.touchable}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.symbolContainer}>
            <Text style={[styles.symbol, compact && styles.compactSymbol]}>
              {symbol}
            </Text>
            <View style={styles.statusContainer}>
              <Text style={[
                styles.statusIndicator,
                { color: getConnectionStatusColor() }
              ]}>
                {getConnectionStatusText()}
              </Text>
            </View>
          </View>
          
          {lastUpdate && (
            <Text style={[styles.timestamp, compact && styles.compactTimestamp]}>
              {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Animated.Text style={[
            styles.price,
            compact && styles.compactPrice,
            { color: priceAnimation.interpolate({
              inputRange: [0, currentPrice],
              outputRange: ['#1f2937', getChangeColor(currentChange)],
            })}
          ]}>
            {formatPrice(currentPrice)}
          </Animated.Text>
          
          {isUpdating && (
            <ActivityIndicator 
              size="small" 
              color="#3b82f6" 
              style={styles.updatingIndicator}
            />
          )}
        </View>

        {/* Change Indicators */}
        {showChange && (
          <View style={styles.changeContainer}>
            <Animated.View style={[
              styles.changeIndicator,
              { 
                backgroundColor: changeAnimation.interpolate({
                  inputRange: [-10, 0, 10],
                  outputRange: ['#fef2f2', '#f9fafb', '#f0fdf4'],
                })
              }
            ]}>
              <Text style={[
                styles.changeIcon,
                { color: getChangeColor(currentChange) }
              ]}>
                {getChangeIcon(currentChange)}
              </Text>
              <Text style={[
                styles.change,
                { color: getChangeColor(currentChange) }
              ]}>
                {formatChange(currentChange)}
              </Text>
              <Text style={[
                styles.changePercent,
                { color: getChangeColor(currentChange) }
              ]}>
                {formatChangePercent(currentChangePercent)}
              </Text>
            </Animated.View>
          </View>
        )}

        {/* Volume */}
        {showVolume && currentVolume > 0 && (
          <View style={styles.volumeContainer}>
            <Text style={[styles.volumeLabel, compact && styles.compactVolumeLabel]}>
              Vol:
            </Text>
            <Text style={[styles.volume, compact && styles.compactVolume]}>
              {formatVolume(currentVolume)}
            </Text>
          </View>
        )}

        {/* Source */}
        {stockData?.source && (
          <View style={styles.sourceContainer}>
            <Text style={[styles.source, compact && styles.compactSource]}>
              {stockData.source}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  return StockCard;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compactContainer: {
    padding: 12,
    marginVertical: 2,
    marginHorizontal: 4,
  },
  touchable: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  symbolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  compactSymbol: {
    fontSize: 16,
  },
  statusContainer: {
    marginLeft: 4,
  },
  statusIndicator: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  compactTimestamp: {
    fontSize: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  compactPrice: {
    fontSize: 20,
  },
  updatingIndicator: {
    marginLeft: 8,
  },
  changeContainer: {
    marginBottom: 8,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  changeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  changePercent: {
    fontSize: 12,
    fontWeight: '500',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  volumeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 4,
  },
  compactVolumeLabel: {
    fontSize: 10,
  },
  volume: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  compactVolume: {
    fontSize: 10,
  },
  sourceContainer: {
    alignItems: 'flex-end',
  },
  source: {
    fontSize: 10,
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactSource: {
    fontSize: 8,
  },
});

export default RealTimeStockDisplay;
