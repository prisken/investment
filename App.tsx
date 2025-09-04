import React from 'react';
import { StatusBar } from 'expo-status-bar';
import RealTimeDashboard from './src/components/RealTimeDashboard';

export default function App() {
  const handleStockPress = (symbol: string) => {
    console.log(`Stock pressed: ${symbol}`);
    // You can add navigation or detailed view here
  };

  const handleIndexPress = (index: any) => {
    console.log(`Index pressed:`, index);
    // You can add navigation or detailed view here
  };

  return (
    <>
      <StatusBar style="light" />
      <RealTimeDashboard 
        onStockPress={handleStockPress}
        onIndexPress={handleIndexPress}
      />
    </>
  );
}
