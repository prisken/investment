import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';

interface CompanyInfo {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: string;
  peRatio: string;
  dividendYield: string;
  eps: string;
  beta: string;
  source: string;
  timestamp: string;
}

interface CompanyInfoProps {
  symbol: string;
  onRefresh?: () => void;
}

const CompanyInfo: React.FC<CompanyInfoProps> = ({ symbol, onRefresh }) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `http://localhost:3000/api/market/enhanced/company/${symbol}`
      );
      const data = await response.json();
      
      if (data.success) {
        setCompanyInfo(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch company info');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching company info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, [symbol]);

  const formatMarketCap = (marketCap: string) => {
    if (!marketCap) return 'N/A';
    
    const num = parseFloat(marketCap);
    if (isNaN(num)) return marketCap;
    
    if (num >= 1000000000000) {
      return `$${(num / 1000000000000).toFixed(2)}T`;
    } else if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (value: string) => {
    if (!value) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `${num.toFixed(2)}%`;
  };

  const formatNumber = (value: string) => {
    if (!value) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toFixed(2);
  };

  const getSectorColor = (sector: string) => {
    const colors: { [key: string]: string } = {
      'Technology': '#007AFF',
      'Healthcare': '#34C759',
      'Financial Services': '#FF9500',
      'Consumer Cyclical': '#FF3B30',
      'Communication Services': '#AF52DE',
      'Industrials': '#5856D6',
      'Consumer Defensive': '#FF2D92',
      'Energy': '#FF9500',
      'Real Estate': '#34C759',
      'Basic Materials': '#5856D6',
      'Utilities': '#007AFF',
    };
    
    return colors[sector] || '#666666';
  };

  const openCompanyWebsite = () => {
    // In a real app, you'd have the actual company website
    const website = `https://finance.yahoo.com/quote/${symbol}`;
    Linking.openURL(website);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Company Information</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading company info...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Company Information</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCompanyInfo}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!companyInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Company Information</Text>
        </View>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No company information available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Company Information</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchCompanyInfo}>
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Company Name and Symbol */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>{companyInfo.name}</Text>
          <Text style={styles.companySymbol}>{companyInfo.symbol}</Text>
        </View>

        {/* Sector and Industry */}
        <View style={styles.sectorContainer}>
          <View style={styles.sectorItem}>
            <Text style={styles.sectorLabel}>Sector</Text>
            <View style={[styles.sectorBadge, { backgroundColor: getSectorColor(companyInfo.sector) }]}>
              <Text style={styles.sectorBadgeText}>{companyInfo.sector}</Text>
            </View>
          </View>
          <View style={styles.sectorItem}>
            <Text style={styles.sectorLabel}>Industry</Text>
            <Text style={styles.industryText}>{companyInfo.industry}</Text>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Market Cap</Text>
              <Text style={styles.metricValue}>
                {formatMarketCap(companyInfo.marketCap)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>P/E Ratio</Text>
              <Text style={styles.metricValue}>
                {formatNumber(companyInfo.peRatio)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Dividend Yield</Text>
              <Text style={styles.metricValue}>
                {formatPercentage(companyInfo.dividendYield)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>EPS</Text>
              <Text style={styles.metricValue}>
                ${formatNumber(companyInfo.eps)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Beta</Text>
              <Text style={styles.metricValue}>
                {formatNumber(companyInfo.beta)}
              </Text>
            </View>
          </View>
        </View>

        {/* Company Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>About {companyInfo.name}</Text>
          <Text style={styles.descriptionText} numberOfLines={expanded ? undefined : 3}>
            {companyInfo.description}
          </Text>
          {companyInfo.description.length > 150 && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setExpanded(!expanded)}
            >
              <Text style={styles.expandButtonText}>
                {expanded ? 'Show Less' : 'Show More'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Additional Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={openCompanyWebsite}>
            <Text style={styles.actionButtonText}>View on Yahoo Finance</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data source: {companyInfo.source}
          </Text>
          <Text style={styles.footerText}>
            Last updated: {new Date(companyInfo.timestamp).toLocaleString()}
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
  companyHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  companySymbol: {
    fontSize: 18,
    color: '#666666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sectorItem: {
    flex: 1,
    alignItems: 'center',
  },
  sectorLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  sectorBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sectorBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  industryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  metricsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  expandButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
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

export default CompanyInfo;
