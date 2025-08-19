import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '@/src/theme';

interface LabeledSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function LabeledSlider({ label, value, onChange }: LabeledSliderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={theme.color.primary}
        maximumTrackTintColor={theme.color.slate[200]}
        thumbTintColor={theme.color.primary}
      />
      
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: theme.typography.sm.fontSize,
    color: theme.color.slate[600],
  },
  value: {
    fontSize: theme.typography.sm.fontSize,
    fontWeight: '500',
    color: theme.color.slate[800],
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: theme.spacing.sm,
  },
  track: {
    marginTop: theme.spacing.sm,
    height: 8,
    borderRadius: 4,
    backgroundColor: `${theme.color.slate[200]}B3`, // 70% opacity
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.color.primary,
  },
});
