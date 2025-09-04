import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  source: string;
  timestamp: string;
}

interface SectorPerformance {
  sector: string;
  performance: number;
}

interface MarketOverview {
  indices: { [key: string]: MarketIndex };
  sectors: SectorPerformance[];
  summary: {
    totalIndices: number;
    totalSectors: number;
    marketStatus: string;
  };
  timestamp: string;
}

interface MarketOverviewDashboardProps {
  onIndexPress?: (index: MarketIndex) => void;
  onSectorPress?: (sector: SectorPerformance) => void;
  refreshInterval?: number;
}

const MarketOverviewDashboard: React.FC<MarketOverviewDashboardProps> = ({
  onIndexPress,
  onSectorPress,
  refreshInterval = 60000, // 1 minute
}) => {
  const [marketData, setMarketData] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMarketOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3000/api/market/enhanced/overview');
      const data = await response.json();
      
      if (data.success) {
        setMarketData(data.data);
        setLastUpdate(new Date());
      } else {
        setError(data.error?.message || 'Failed to fetch market overview');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching market overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketOverview();
    
    const interval = setInterval(fetchMarketOverview, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMarketOverview();
  };

  const getMarketStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'bullish':
        return '#00C851';
      case 'bearish':
        return '#FF4444';
      case 'mixed':
        return '#FF9500';
      default:
        return '#666666';
    }
  };

  const getMarketStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'bullish':
        return '📈';
      case 'bearish':
        return '📉';
      case 'mixed':
        return '📊';
      default:
        return '📊';
    }
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

  const getSectorColor = (performance: number) => {
    if (performance > 0) return '#00C851';
    if (performance < 0) return '#FF4444';
    return '#666666';
  };

  if (loading && !marketData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Market Overview</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading market data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Market Overview</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMarketOverview}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!marketData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Market Overview</Text>
        </View>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No market data available</Text>
        </View>
      </View>
    );
  }

  const indices = Object.values(marketData.indices);
  const sectors = marketData.sectors || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Market Overview</Text>
        <View style={styles.headerRight}>
          <Text style={styles.lastUpdate}>
            {lastUpdate?.toLocaleTimeString()}
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>↻</Text>
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
        {/* Market Status */}
        <View style={styles.marketStatusContainer}>
          <View style={styles.marketStatusHeader}>
            <Text style={styles.marketStatusIcon}>
              {getMarketStatusIcon(marketData.summary.marketStatus)}
            </Text>
            <Text style={styles.marketStatusTitle}>Market Status</Text>
          </View>
          <View style={[
            styles.marketStatusBadge,
            { backgroundColor: getMarketStatusColor(marketData.summary.marketStatus) }
          ]}>
            <Text style={styles.marketStatusText}>
              {marketData.summary.marketStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Market Indices */}
        {indices.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Market Indices</Text>
            <View style={styles.indicesContainer}>
              {indices.map((index) => (
                <TouchableOpacity
                  key={index.symbol}
                  style={styles.indexCard}
                  onPress={() => onIndexPress?.(index)}
                >
                  <View style={styles.indexHeader}>
                    <Text style={styles.indexSymbol}>{index.symbol}</Text>
                    <Text style={styles.indexName}>{index.name}</Text>
                  </View>
                  <View style={styles.indexPriceContainer}>
                    <Text style={styles.indexPrice}>
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
                  <View style={styles.indexFooter}>
                    <Text style={styles.indexSource}>{index.source}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Sector Performance */}
        {sectors.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Sector Performance</Text>
            <View style={styles.sectorsContainer}>
              {sectors.map((sector, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sectorCard}
                  onPress={() => onSectorPress?.(sector)}
                >
                  <View style={styles.sectorHeader}>
                    <Text style={styles.sectorName}>{sector.sector}</Text>
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
                          width: `${Math.abs(sector.performance)}%`,
                          backgroundColor: getSectorColor(sector.performance),
                          alignSelf: sector.performance >= 0 ? 'flex-end' : 'flex-start',
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Market Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Market Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Indices</Text>
              <Text style={styles.summaryValue}>{marketData.summary.totalIndices}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Sectors</Text>
              <Text style={styles.summaryValue}>{marketData.summary.totalSectors}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Market Status</Text>
              <Text style={[
                styles.summaryValue,
                { color: getMarketStatusColor(marketData.summary.marketStatus) }
              ]}>
                {marketData.summary.marketStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data updated: {new Date(marketData.timestamp).toLocaleString()}
          </Text>
          <Text style={styles.footerText}>
            Auto-refresh every {refreshInterval / 1000}s
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999999',
    marginRight: 12,
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
  content: {
    padding: 16,
  },
  marketStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  marketStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketStatusIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  marketStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  marketStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  marketStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  indicesContainer: {
    gap: 12,
  },
  indexCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  indexHeader: {
    marginBottom: 12,
  },
  indexSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  indexName: {
    fontSize: 14,
    color: '#666666',
  },
  indexPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  indexPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
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
  indexFooter: {
    alignItems: 'flex-end',
  },
  indexSource: {
    fontSize: 12,
    color: '#999999',
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectorsContainer: {
    gap: 12,
  },
  sectorCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
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
    color: '#1A1A1A',
  },
  sectorPerformance: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectorBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sectorBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default MarketOverviewDashboard;
