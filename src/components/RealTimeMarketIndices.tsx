import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import webSocketService, { RealTimeMarketUpdate } from '../services/WebSocketService';
import { MarketIndex } from '../types/stock';

interface RealTimeMarketIndicesProps {
  onIndexPress?: (index: MarketIndex) => void;
  refreshInterval?: number;
  showSectors?: boolean;
  compact?: boolean;
}

const RealTimeMarketIndices: React.FC<RealTimeMarketIndicesProps> = ({
  onIndexPress,
  refreshInterval = 60000,
  showSectors = true,
  compact = false,
}) => {
  const [marketData, setMarketData] = useState<RealTimeMarketUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Animation values
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const flashAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Connect to WebSocket
    const connectWebSocket = async () => {
      try {
        await webSocketService.connect();
        setIsConnected(true);
        
        // Subscribe to market indices
        webSocketService.subscribeToMarketIndices();
        
        // Listen for updates
        webSocketService.on('market-update', handleMarketUpdate);
        webSocketService.on('connection-status', handleConnectionStatus);
        webSocketService.on('error', handleError);
        
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // Set up periodic refresh
    const interval = setInterval(() => {
      if (isConnected) {
        webSocketService.requestDataRefresh('market');
      }
    }, refreshInterval);

    return () => {
      // Cleanup
      clearInterval(interval);
      webSocketService.off('market-update', handleMarketUpdate);
      webSocketService.off('connection-status', handleConnectionStatus);
      webSocketService.off('error', handleError);
      webSocketService.unsubscribeFromMarketIndices();
    };
  }, [refreshInterval, isConnected]);

  const handleMarketUpdate = (data: RealTimeMarketUpdate) => {
    setIsUpdating(true);
    
    // Animate update
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
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Slide animation
    Animated.sequence([
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setMarketData(data);
    setLastUpdate(new Date());
    
    setTimeout(() => setIsUpdating(false), 1000);
  };

  const handleConnectionStatus = (status: 'connected' | 'disconnected' | 'error') => {
    setIsConnected(status === 'connected');
  };

  const handleError = (error: string) => {
    console.error('WebSocket error:', error);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      webSocketService.requestDataRefresh('market');
    } catch (error) {
      console.error('Error refreshing market data:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

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

  const formatSectorPerformance = (performance: number) => {
    const sign = performance >= 0 ? '+' : '';
    return `${sign}${performance.toFixed(2)}%`;
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

  const getSectorColor = (performance: number) => {
    if (performance > 0) return '#10b981';
    if (performance < 0) return '#ef4444';
    return '#6b7280';
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

  const indices = marketData ? Object.values(marketData.indices) : [];
  const sectors = marketData?.sectors || [];

  if (!marketData) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <View style={styles.header}>
          <Text style={[styles.title, compact && styles.compactTitle]}>
            Market Indices
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading market data...</Text>
        </View>
      </View>
    );
  }

  return (
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, compact && styles.compactTitle]}>
            Market Indices
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
        
        <View style={styles.headerRight}>
          {lastUpdate && (
            <Text style={[styles.lastUpdate, compact && styles.compactLastUpdate]}>
              {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.refreshButtonText}>↻</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Market Indices */}
        {indices.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, compact && styles.compactSectionTitle]}>
              Major Indices
            </Text>
            <View style={styles.indicesContainer}>
              {indices.map((index) => (
                <TouchableOpacity
                  key={index.symbol}
                  style={[styles.indexCard, compact && styles.compactIndexCard]}
                  onPress={() => onIndexPress?.(index)}
                >
                  <View style={styles.indexHeader}>
                    <Text style={[styles.indexSymbol, compact && styles.compactIndexSymbol]}>
                      {index.symbol}
                    </Text>
                    <Text style={[styles.indexName, compact && styles.compactIndexName]}>
                      {index.name}
                    </Text>
                  </View>
                  
                  <View style={styles.indexPriceContainer}>
                    <Text style={[styles.indexPrice, compact && styles.compactIndexPrice]}>
                      ${formatPrice(index.price)}
                    </Text>
                    <View style={styles.indexChangeContainer}>
                      <Text style={[
                        styles.indexChangeIcon,
                        { color: getChangeColor(index.change) }
                      ]}>
                        {getChangeIcon(index.change)}
                      </Text>
                      <Text style={[
                        styles.indexChange,
                        { color: getChangeColor(index.change) }
                      ]}>
                        {formatChange(index.change)}
                      </Text>
                      <Text style={[
                        styles.indexChangePercent,
                        { color: getChangeColor(index.change) }
                      ]}>
                        {formatChangePercent(index.changePercent)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Sector Performance */}
        {showSectors && sectors.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, compact && styles.compactSectionTitle]}>
              Sector Performance
            </Text>
            <View style={styles.sectorsContainer}>
              {sectors.map((sector, index) => (
                <View
                  key={index}
                  style={[styles.sectorCard, compact && styles.compactSectorCard]}
                >
                  <View style={styles.sectorHeader}>
                    <Text style={[styles.sectorName, compact && styles.compactSectorName]}>
                      {sector.sector}
                    </Text>
                    <Text style={[
                      styles.sectorPerformance,
                      { color: getSectorColor(sector.performance) }
                    ]}>
                      {formatSectorPerformance(sector.performance)}
                    </Text>
                  </View>
                  <View style={styles.sectorBar}>
                    <View
                      style={[
                        styles.sectorBarFill,
                        {
                          width: `${Math.min(Math.abs(sector.performance) * 10, 100)}%`,
                          backgroundColor: getSectorColor(sector.performance),
                          alignSelf: sector.performance >= 0 ? 'flex-end' : 'flex-start',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, compact && styles.compactFooterText]}>
            Data updated: {marketData.timestamp ? new Date(marketData.timestamp).toLocaleString() : 'N/A'}
          </Text>
          <Text style={[styles.footerText, compact && styles.compactFooterText]}>
            Auto-refresh every {refreshInterval / 1000}s
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
    maxHeight: 600,
  },
  compactContainer: {
    marginVertical: 4,
    marginHorizontal: 8,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  compactTitle: {
    fontSize: 16,
  },
  statusContainer: {
    marginLeft: 4,
  },
  statusIndicator: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 12,
  },
  compactLastUpdate: {
    fontSize: 10,
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  compactSectionTitle: {
    fontSize: 14,
  },
  indicesContainer: {
    gap: 12,
  },
  indexCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  compactIndexCard: {
    padding: 12,
  },
  indexHeader: {
    marginBottom: 12,
  },
  indexSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  compactIndexSymbol: {
    fontSize: 16,
  },
  indexName: {
    fontSize: 14,
    color: '#6b7280',
  },
  compactIndexName: {
    fontSize: 12,
  },
  indexPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indexPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  compactIndexPrice: {
    fontSize: 20,
  },
  indexChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indexChangeIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  indexChange: {
    fontSize: 16,
    fontWeight: '600',
  },
  indexChangePercent: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectorsContainer: {
    gap: 12,
  },
  sectorCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  compactSectorCard: {
    padding: 12,
  },
  sectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  compactSectorName: {
    fontSize: 14,
  },
  sectorPerformance: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectorBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sectorBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  compactFooterText: {
    fontSize: 10,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default RealTimeMarketIndices;
