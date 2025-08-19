import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/src/theme';

interface ModeBadgeProps {
  mode: "audio" | "video";
}

export function ModeBadge({ mode }: ModeBadgeProps) {
  const isVideo = mode === "video";
  
  return (
    <View style={[styles.badge, isVideo ? styles.badgeVideo : styles.badgeAudio]}>
      <Text style={[styles.text, isVideo ? styles.textVideo : styles.textAudio]}>
        {isVideo ? "Audio + Video" : "Audio only"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeAudio: {
    backgroundColor: theme.color.emerald[100],
  },
  badgeVideo: {
    backgroundColor: theme.color.indigo[100],
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  textAudio: {
    color: theme.color.emerald[700],
  },
  textVideo: {
    color: theme.color.indigo[700],
  },
});
