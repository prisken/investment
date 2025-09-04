import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import StockPriceDisplay from '../components/StockPriceDisplay';
import StockChart from '../components/StockChart';
import StockSearch from '../components/StockSearch';
import CompanyInfo from '../components/CompanyInfo';
import MarketOverviewDashboard from '../components/MarketOverviewDashboard';

const FrontendDemoScreen: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);

  const handleStockSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    Alert.alert('Stock Selected', `You selected: ${symbol}`);
  };

  const handleIndexPress = (index: any) => {
    Alert.alert('Index Pressed', `You pressed: ${index.symbol}`);
  };

  const handleSectorPress = (sector: any) => {
    Alert.alert('Sector Pressed', `You pressed: ${sector.sector}`);
  };

  const toggleCompanyInfo = () => {
    setShowCompanyInfo(!showCompanyInfo);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Frontend Components Demo</Text>
          <Text style={styles.headerSubtitle}>
            Showcasing all the components we've built
          </Text>
        </View>

        {/* Stock Search Component */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Stock Search Component</Text>
          <Text style={styles.sectionDescription}>
            Search for stocks with autocomplete, recent searches, and popular stocks
          </Text>
          <StockSearch
            onStockSelect={handleStockSelect}
            placeholder="Search for stocks..."
            showRecentSearches={true}
            showPopularStocks={true}
          />
        </View>

        {/* Stock Price Display Component */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Stock Price Display Component</Text>
          <Text style={styles.sectionDescription}>
            Real-time stock price display with animations and detailed information
          </Text>
          <StockPriceDisplay
            symbol={selectedSymbol}
            showDetails={true}
            refreshInterval={30000}
            onPress={() => Alert.alert('Stock Pressed', `You pressed: ${selectedSymbol}`)}
          />
        </View>

        {/* Stock Chart Component */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Stock Chart Component</Text>
          <Text style={styles.sectionDescription}>
            Interactive price charts with multiple time periods and volume data
          </Text>
          <StockChart
            symbol={selectedSymbol}
            period="1d"
            height={250}
            showVolume={true}
            onDataPointPress={(dataPoint) => 
              Alert.alert('Data Point', `Price: $${dataPoint.price}`)
            }
          />
        </View>

        {/* Company Information Component */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Company Information Component</Text>
          <Text style={styles.sectionDescription}>
            Comprehensive company details, fundamentals, and sector information
          </Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleCompanyInfo}
          >
            <Text style={styles.toggleButtonText}>
              {showCompanyInfo ? 'Hide' : 'Show'} Company Info
            </Text>
          </TouchableOpacity>
          {showCompanyInfo && (
            <CompanyInfo symbol={selectedSymbol} />
          )}
        </View>

        {/* Market Overview Dashboard Component */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Market Overview Dashboard</Text>
          <Text style={styles.sectionDescription}>
            Real-time market indices, sector performance, and market status
          </Text>
          <MarketOverviewDashboard
            onIndexPress={handleIndexPress}
            onSectorPress={handleSectorPress}
            refreshInterval={60000}
          />
        </View>

        {/* Component Features Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Component Features Summary</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Stock Search</Text>
              <Text style={styles.featureText}>• Autocomplete search</Text>
              <Text style={styles.featureText}>• Recent searches</Text>
              <Text style={styles.featureText}>• Popular stocks</Text>
              <Text style={styles.featureText}>• Debounced input</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Price Display</Text>
              <Text style={styles.featureText}>• Real-time updates</Text>
              <Text style={styles.featureText}>• Price animations</Text>
              <Text style={styles.featureText}>• Change indicators</Text>
              <Text style={styles.featureText}>• Detailed metrics</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Stock Charts</Text>
              <Text style={styles.featureText}>• Multiple timeframes</Text>
              <Text style={styles.featureText}>• Interactive data points</Text>
              <Text style={styles.featureText}>• Volume visualization</Text>
              <Text style={styles.featureText}>• Grid lines & labels</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Company Info</Text>
              <Text style={styles.featureText}>• Company fundamentals</Text>
              <Text style={styles.featureText}>• Sector classification</Text>
              <Text style={styles.featureText}>• Key metrics</Text>
              <Text style={styles.featureText}>• Expandable description</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Market Dashboard</Text>
              <Text style={styles.featureText}>• Market indices</Text>
              <Text style={styles.featureText}>• Sector performance</Text>
              <Text style={styles.featureText}>• Market status</Text>
              <Text style={styles.featureText}>• Auto-refresh</Text>
            </View>
          </View>
        </View>

        {/* Technical Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Implementation</Text>
          <View style={styles.techDetails}>
            <Text style={styles.techText}>• Built with React Native + TypeScript</Text>
            <Text style={styles.techText}>• Professional UI/UX design</Text>
            <Text style={styles.techText}>• Real-time data integration</Text>
            <Text style={styles.techText}>• Responsive and accessible</Text>
            <Text style={styles.techText}>• Error handling & loading states</Text>
            <Text style={styles.techText}>• Performance optimized</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Investment App Frontend Components
          </Text>
          <Text style={styles.footerText}>
            Built with ❤️ using React Native
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  section: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  featuresGrid: {
    gap: 16,
  },
  featureItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  techDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  techText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  footer: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
});

export default FrontendDemoScreen;
