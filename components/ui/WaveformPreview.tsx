import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '@/src/theme';

interface WaveformPreviewProps {
  level?: number;
}

export function WaveformPreview({ level = 0.5 }: WaveformPreviewProps) {
  const heights = useRef<Animated.Value[]>(
    Array.from({ length: 40 }, (_, i) => new Animated.Value(20 + ((i * 13) % 44)))
  ).current;

  useEffect(() => {
    const animations: Animated.CompositeAnimation[] = [];
    
    heights.forEach((height, i) => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(height, {
            toValue: 20 + ((i * 13) % 44) + (level * 20),
            duration: 1000 + (i * 50),
            useNativeDriver: false,
          }),
          Animated.timing(height, {
            toValue: 20 + ((i * 13) % 44),
            duration: 1000 + (i * 50),
            useNativeDriver: false,
          }),
        ])
      );
      animations.push(animation);
      animation.start();
    });

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, [level]);

  return (
    <View style={styles.container}>
      {heights.map((height, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: height,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    width: '100%',
    height: 112, // 28 * 4 (28 is 7rem in Tailwind)
    overflow: 'hidden',
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: '#6B8CFF',
    opacity: 0.9,
  },
});
