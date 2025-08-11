import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LevelBarProps {
  level: number; // 0-1
  threshold: number; // 0-1
}

export function LevelBar({ level, threshold }: LevelBarProps) {
  const levelPercent = Math.min(100, level * 100);
  const thresholdPercent = threshold * 100;
  const isAboveThreshold = level > threshold;

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <View 
          style={[
            styles.levelBar, 
            { 
              width: `${levelPercent}%`,
              backgroundColor: isAboveThreshold ? '#ef4444' : '#3b82f6'
            }
          ]} 
        />
        <View 
          style={[
            styles.thresholdLine, 
            { left: `${thresholdPercent}%` }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  barBackground: {
    width: 300,
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  levelBar: {
    height: '100%',
    borderRadius: 10,
    transition: 'width 0.1s ease',
  },
  thresholdLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#fbbf24',
    zIndex: 1,
  },
});