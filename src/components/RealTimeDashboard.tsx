import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import RealTimeStockDisplay from './RealTimeStockDisplay';
import RealTimeMarketIndices from './RealTimeMarketIndices';
import webSocketService from '../services/WebSocketService';

interface RealTimeDashboardProps {
  onStockPress?: (symbol: string) => void;
  onIndexPress?: (index: any) => void;
}

const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({
  onStockPress,
  onIndexPress,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    totalUpdates: 0,
    connectedClients: 0,
    subscribedStocks: 0,
  });

  const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'META', 'NVDA', 'AMZN', 'NFLX'];

  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        setConnectionStatus('connecting');
        await webSocketService.connect();
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Subscribe to popular stocks
        webSocketService.subscribeToStocks(popularStocks);
        
        // Listen for connection status changes
        webSocketService.on('connection-status', handleConnectionStatus);
        webSocketService.on('stock-update', handleStockUpdate);
        webSocketService.on('error', handleError);
        
        // Request initial data refresh
        webSocketService.requestDataRefresh('all');
        
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        setConnectionStatus('error');
        setIsConnected(false);
      }
    };

    initializeWebSocket();

    return () => {
      webSocketService.off('connection-status', handleConnectionStatus);
      webSocketService.off('stock-update', handleStockUpdate);
      webSocketService.off('error', handleError);
      webSocketService.unsubscribeFromStocks(popularStocks);
    };
  }, []);

  const handleConnectionStatus = (status: 'connected' | 'disconnected' | 'error') => {
    setConnectionStatus(status);
    setIsConnected(status === 'connected');
    
    if (status === 'connected') {
      setLastUpdate(new Date());
    }
  };

  const handleStockUpdate = () => {
    setStats(prev => ({
      ...prev,
      totalUpdates: prev.totalUpdates + 1,
    }));
    setLastUpdate(new Date());
  };

  const handleError = (error: string) => {
    console.error('WebSocket error:', error);
    Alert.alert('Connection Error', error);
  };

  const handleRefreshAll = () => {
    if (isConnected) {
      webSocketService.requestDataRefresh('all');
      setLastUpdate(new Date());
    } else {
      Alert.alert('Not Connected', 'Please wait for connection to be established.');
    }
  };

  const handleReconnect = async () => {
    try {
      setConnectionStatus('connecting');
      await webSocketService.connect();
      setIsConnected(true);
      setConnectionStatus('connected');
      webSocketService.subscribeToStocks(popularStocks);
      webSocketService.requestDataRefresh('all');
    } catch (error) {
      setConnectionStatus('error');
      Alert.alert('Reconnection Failed', 'Could not reconnect to the server.');
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '●';
      case 'connecting': return '⟳';
      case 'disconnected': return '●';
      case 'error': return '⚠';
      default: return '●';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Real-Time Market Dashboard</Text>
        <Text style={styles.subtitle}>
          Live data with WebSocket connections
        </Text>
        
        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View style={styles.statusIndicator}>
            <Text style={[
              styles.statusIcon,
              { color: getConnectionStatusColor() }
            ]}>
              {getConnectionStatusIcon()}
            </Text>
            <Text style={[
              styles.statusText,
              { color: getConnectionStatusColor() }
            ]}>
              {getConnectionStatusText()}
            </Text>
          </View>
          
          {connectionStatus === 'error' && (
            <TouchableOpacity style={styles.reconnectButton} onPress={handleReconnect}>
              <Text style={styles.reconnectButtonText}>Reconnect</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalUpdates}</Text>
            <Text style={styles.statLabel}>Updates</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{popularStocks.length}</Text>
            <Text style={styles.statLabel}>Stocks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Last Update</Text>
          </View>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          style={[
            styles.refreshButton,
            !isConnected && styles.refreshButtonDisabled
          ]}
          onPress={handleRefreshAll}
          disabled={!isConnected}
        >
          <Text style={styles.refreshButtonText}>
            🔄 Refresh All Data
          </Text>
        </TouchableOpacity>
      </View>

      {/* Market Indices */}
      <RealTimeMarketIndices
        onIndexPress={onIndexPress}
        showSectors={true}
        compact={false}
      />

      {/* Real-Time Stocks */}
      <View style={styles.stocksSection}>
        <Text style={styles.sectionTitle}>📈 Real-Time Stock Prices</Text>
        <Text style={styles.sectionSubtitle}>
          Live updates with volume and change indicators
        </Text>
        
        {popularStocks.map((symbol) => (
          <RealTimeStockDisplay
            key={symbol}
            symbol={symbol}
            onPress={() => onStockPress?.(symbol)}
            showVolume={true}
            showChange={true}
            compact={false}
          />
        ))}
      </View>

      {/* Features Info */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>✨ Real-Time Features</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔌</Text>
            <Text style={styles.featureText}>WebSocket connections for instant updates</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Real-time price updates with animations</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📈</Text>
            <Text style={styles.featureText}>Market indices display with live data</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📉</Text>
            <Text style={styles.featureText}>Volume and change indicators</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔄</Text>
            <Text style={styles.featureText}>Automatic data refresh mechanisms</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎨</Text>
            <Text style={styles.featureText}>Smooth animations and visual feedback</Text>
          </View>
        </View>
      </View>

      {/* Technical Info */}
      <View style={styles.techInfoContainer}>
        <Text style={styles.techInfoTitle}>🔧 Technical Details</Text>
        <Text style={styles.techInfoText}>
          • WebSocket server running on port 3000{'\n'}
          • Real-time data from Alpha Vantage, Finnhub & Polygon.io{'\n'}
          • Automatic reconnection with exponential backoff{'\n'}
          • Batch updates for multiple stocks{'\n'}
          • Connection status monitoring{'\n'}
          • Pull-to-refresh and manual refresh support
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  reconnectButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reconnectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  refreshButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stocksSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  featuresContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  techInfoContainer: {
    backgroundColor: '#f0f9ff',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  techInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  techInfoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
});

export default RealTimeDashboard;
