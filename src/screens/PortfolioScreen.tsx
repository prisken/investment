import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function PortfolioScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
        <Text style={styles.subtitle}>Track your investments</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Portfolio Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Value:</Text>
            <Text style={styles.summaryValue}>$25,000.00</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Today's Change:</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>+$450.00 (+1.83%)</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Return:</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>+$3,200.00 (+14.68%)</Text>
          </View>
        </View>

        <View style={styles.holdingsCard}>
          <Text style={styles.sectionTitle}>Holdings</Text>
          
          <View style={styles.holdingItem}>
            <View style={styles.holdingInfo}>
              <Text style={styles.holdingSymbol}>AAPL</Text>
              <Text style={styles.holdingName}>Apple Inc.</Text>
            </View>
            <View style={styles.holdingDetails}>
              <Text style={styles.holdingShares}>10 shares</Text>
              <Text style={styles.holdingValue}>$1,750.00</Text>
              <Text style={[styles.holdingChange, { color: '#10b981' }]}>+$25.00 (+1.45%)</Text>
            </View>
          </View>

          <View style={styles.holdingItem}>
            <View style={styles.holdingInfo}>
              <Text style={styles.holdingSymbol}>GOOGL</Text>
              <Text style={styles.holdingName}>Alphabet Inc.</Text>
            </View>
            <View style={styles.holdingDetails}>
              <Text style={styles.holdingShares}>5 shares</Text>
              <Text style={styles.holdingValue}>$6,250.00</Text>
              <Text style={[styles.holdingChange, { color: '#10b981' }]}>+$125.00 (+2.04%)</Text>
            </View>
          </View>

          <View style={styles.holdingItem}>
            <View style={styles.holdingInfo}>
              <Text style={styles.holdingSymbol}>0700</Text>
              <Text style={styles.holdingName}>Tencent Holdings</Text>
            </View>
            <View style={styles.holdingDetails}>
              <Text style={styles.holdingShares}>100 shares</Text>
              <Text style={styles.holdingValue}>$3,200.00</Text>
              <Text style={[styles.holdingChange, { color: '#ef4444' }]}>-$80.00 (-2.44%)</Text>
            </View>
          </View>
        </View>

        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonTitle}>🚀 Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            • AI-powered portfolio recommendations{'\n'}
            • Risk analysis and diversification insights{'\n'}
            • Automated rebalancing suggestions{'\n'}
            • Performance tracking and analytics
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  holdingsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 15,
  },
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  holdingInfo: {
    flex: 1,
  },
  holdingSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  holdingName: {
    fontSize: 14,
    color: '#666',
  },
  holdingDetails: {
    alignItems: 'flex-end',
  },
  holdingShares: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  holdingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  holdingChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  comingSoonCard: {
    backgroundColor: '#10b981',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  comingSoonText: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    lineHeight: 20,
  },
});
