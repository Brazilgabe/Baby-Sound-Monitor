import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Mic, Video } from 'lucide-react-native';
import { theme } from '@/src/theme';

interface ModeChipsProps {
  mode: "audio" | "video";
  onChange: (mode: "audio" | "video") => void;
}

export function ModeChips({ mode, onChange }: ModeChipsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.chip, mode === "audio" && styles.chipSelected]}
        onPress={() => onChange("audio")}
        activeOpacity={0.8}
      >
        <Mic size={14} color={mode === "audio" ? "#FFFFFF" : theme.color.slate[700]} />
        <Text style={[styles.chipText, mode === "audio" && styles.chipTextSelected]}>
          Audio only
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.chip, mode === "video" && styles.chipSelected]}
        onPress={() => onChange("video")}
        activeOpacity={0.8}
      >
        <Video size={14} color={mode === "video" ? "#FFFFFF" : theme.color.slate[700]} />
        <Text style={[styles.chipText, mode === "video" && styles.chipTextSelected]}>
          Audio + Video
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.color.slate[200],
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipSelected: {
    backgroundColor: theme.color.primary,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: theme.typography.sm.fontSize,
    color: theme.color.slate[700],
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
