import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface ThresholdSliderProps {
  value: number; // 0-1
  onValueChange: (value: number) => void;
}

export function ThresholdSlider({ value, onValueChange }: ThresholdSliderProps) {
  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={0.1}
        maximumValue={0.9}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#3b82f6"
        maximumTrackTintColor="#e5e7eb"
        thumbTintColor="#3b82f6"
      />
      <View style={styles.labels}>
        <Text style={styles.labelText}>10%</Text>
        <Text style={styles.labelText}>90%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  labelText: {
    fontSize: 12,
    color: '#6b7280',
  },
});