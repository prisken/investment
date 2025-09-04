import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Line, Text as SvgText, G } from 'react-native-svg';

interface ChartDataPoint {
  timestamp: string;
  price: number;
  volume?: number;
}

interface StockChartProps {
  symbol: string;
  period?: '1h' | '1d' | '1w' | '1m';
  height?: number;
  showVolume?: boolean;
  onDataPointPress?: (dataPoint: ChartDataPoint) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 32; // Account for margins
const CHART_HEIGHT = 200;
const PADDING = 20;

const StockChart: React.FC<StockChartProps> = ({
  symbol,
  period = '1d',
  height = CHART_HEIGHT,
  showVolume = false,
  onDataPointPress,
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  const periods = [
    { key: '1h', label: '1H' },
    { key: '1d', label: '1D' },
    { key: '1w', label: '1W' },
    { key: '1m', label: '1M' },
  ];

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get real data from the backend first
      const response = await fetch(
        `http://localhost:3000/api/data-processing/historical/${symbol}?period=${selectedPeriod}&limit=100`
      );
      const data = await response.json();
      
      if (data.success && data.data.data && data.data.data.length > 0) {
        setChartData(data.data.data);
      } else {
        // Fallback to mock data if no real data available
        console.log('No real data available, using mock data for chart');
        const mockData = generateMockChartData(selectedPeriod);
        setChartData(mockData);
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      // Fallback to mock data on error
      const mockData = generateMockChartData(selectedPeriod);
      setChartData(mockData);
      setError('Using mock data (real data unavailable)');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for fallback
  const generateMockChartData = (period: string): ChartDataPoint[] => {
    const now = new Date();
    const dataPoints: ChartDataPoint[] = [];
    let basePrice = 100 + Math.random() * 50;
    
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now.getTime() - (50 - i) * getTimeInterval(period));
      basePrice += (Math.random() - 0.5) * 2;
      dataPoints.push({
        timestamp: timestamp.toISOString(),
        price: Math.max(1, basePrice),
        volume: Math.floor(Math.random() * 1000000) + 100000
      });
    }
    
    return dataPoints;
  };

  const getTimeInterval = (period: string): number => {
    switch (period) {
      case '1h': return 60 * 60 * 1000; // 1 hour
      case '1d': return 24 * 60 * 60 * 1000; // 1 day
      case '1w': return 7 * 24 * 60 * 60 * 1000; // 1 week
      case '1m': return 30 * 24 * 60 * 60 * 1000; // 1 month
      default: return 24 * 60 * 60 * 1000;
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [symbol, selectedPeriod]);

  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod as any);
  };

  const generateChartPath = (data: ChartDataPoint[]) => {
    if (data.length < 2) return '';

    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const xStep = (CHART_WIDTH - 2 * PADDING) / (data.length - 1);
    const yScale = (height - 2 * PADDING) / priceRange;

    let path = '';
    data.forEach((point, index) => {
      const x = PADDING + index * xStep;
      const y = height - PADDING - (point.price - minPrice) * yScale;
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  };

  const generateVolumeBars = (data: ChartDataPoint[]) => {
    if (!showVolume || data.length === 0) return null;

    const volumes = data.map(d => d.volume || 0);
    const maxVolume = Math.max(...volumes);
    const volumeScale = (height * 0.3) / maxVolume;
    const barWidth = (CHART_WIDTH - 2 * PADDING) / data.length;

    return data.map((point, index) => {
      const x = PADDING + index * barWidth;
      const barHeight = (point.volume || 0) * volumeScale;
      const y = height - PADDING - barHeight;

      return (
        <Line
          key={`volume-${index}`}
          x1={x + barWidth / 2}
          y1={height - PADDING}
          x2={x + barWidth / 2}
          y2={y}
          stroke="#007AFF"
          strokeWidth={2}
          opacity={0.6}
        />
      );
    });
  };

  const generateGridLines = () => {
    const lines = [];
    const gridCount = 5;

    // Horizontal grid lines
    for (let i = 0; i <= gridCount; i++) {
      const y = PADDING + (i * (height - 2 * PADDING)) / gridCount;
      lines.push(
        <Line
          key={`h-${i}`}
          x1={PADDING}
          y1={y}
          x2={CHART_WIDTH - PADDING}
          y2={y}
          stroke="#E0E0E0"
          strokeWidth={1}
          opacity={0.5}
        />
      );
    }

    // Vertical grid lines
    for (let i = 0; i <= gridCount; i++) {
      const x = PADDING + (i * (CHART_WIDTH - 2 * PADDING)) / gridCount;
      lines.push(
        <Line
          key={`v-${i}`}
          x1={x}
          y1={PADDING}
          x2={x}
          y2={height - PADDING}
          stroke="#E0E0E0"
          strokeWidth={1}
          opacity={0.5}
        />
      );
    }

    return lines;
  };

  const generatePriceLabels = () => {
    if (chartData.length === 0) return null;

    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const labelCount = 5;

    const labels = [];
    for (let i = 0; i <= labelCount; i++) {
      const price = minPrice + (i * priceRange) / labelCount;
      const y = height - PADDING - (i * (height - 2 * PADDING)) / labelCount;
      
      labels.push(
        <SvgText
          key={`price-${i}`}
          x={PADDING - 8}
          y={y + 4}
          fontSize="10"
          fill="#666666"
          textAnchor="end"
        >
          ${price.toFixed(2)}
        </SvgText>
      );
    }

    return labels;
  };

  const generateTimeLabels = () => {
    if (chartData.length === 0) return null;

    const labelCount = 4;
    const step = Math.floor(chartData.length / labelCount);
    const labels = [];

    for (let i = 0; i <= labelCount; i++) {
      const index = i * step;
      if (index < chartData.length) {
        const point = chartData[index];
        const x = PADDING + index * ((CHART_WIDTH - 2 * PADDING) / (chartData.length - 1));
        const time = new Date(point.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });

        labels.push(
          <SvgText
            key={`time-${i}`}
            x={x}
            y={height - PADDING + 20}
            fontSize="10"
            fill="#666666"
            textAnchor="middle"
          >
            {time}
          </SvgText>
        );
      }
    }

    return labels;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Price Chart</Text>
          <View style={styles.periodSelector}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.key && styles.periodButtonActive,
                ]}
                onPress={() => handlePeriodChange(period.key)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period.key && styles.periodButtonTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.chartContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading chart data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Price Chart</Text>
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchChartData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (chartData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Price Chart</Text>
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.noDataText}>No chart data available</Text>
        </View>
      </View>
    );
  }

  const chartPath = generateChartPath(chartData);

  return (
    <View style={styles.container}>
      {/* Header with Period Selector */}
      <View style={styles.header}>
        <Text style={styles.title}>Price Chart</Text>
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => handlePeriodChange(period.key)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart Container */}
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={height}>
          {/* Grid Lines */}
          {generateGridLines()}
          
          {/* Price Labels */}
          {generatePriceLabels()}
          
          {/* Time Labels */}
          {generateTimeLabels()}
          
          {/* Volume Bars (if enabled) */}
          {showVolume && generateVolumeBars(chartData)}
          
          {/* Price Chart Line */}
          <Path
            d={chartPath}
            stroke="#007AFF"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data Points */}
          {chartData.map((point, index) => {
            const prices = chartData.map(d => d.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const priceRange = maxPrice - minPrice || 1;
            
            const x = PADDING + index * ((CHART_WIDTH - 2 * PADDING) / (chartData.length - 1));
            const y = height - PADDING - (point.price - minPrice) * ((height - 2 * PADDING) / priceRange);
            
            return (
              <G key={`point-${index}`}>
                <Line
                  x1={x}
                  y1={y - 4}
                  x2={x}
                  y2={y + 4}
                  stroke="#007AFF"
                  strokeWidth={2}
                />
                <Line
                  x1={x - 4}
                  y1={y}
                  x2={x + 4}
                  y2={y}
                  stroke="#007AFF"
                  strokeWidth={2}
                />
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Chart Info */}
      <View style={styles.chartInfo}>
        <Text style={styles.chartInfoText}>
          {chartData.length} data points • {selectedPeriod} period
        </Text>
        {chartData.length > 0 && (
          <Text style={styles.chartInfoText}>
            Range: ${Math.min(...chartData.map(d => d.price)).toFixed(2)} - ${Math.max(...chartData.map(d => d.price)).toFixed(2)}
          </Text>
        )}
      </View>
    </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CHART_HEIGHT,
  },
  chartInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  chartInfoText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 4,
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
  noDataText: {
    fontSize: 14,
    color: '#666666',
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

export default StockChart;
