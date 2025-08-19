import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, Settings } from 'lucide-react-native';
import { theme } from '@/src/theme';

interface HeaderProps {
  onBack?: () => void;
  onSettings?: () => void;
  title?: string;
}

export function Header({ onBack, onSettings, title = "iQueue Baby Monitor" }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity style={styles.button} onPress={onBack} activeOpacity={0.8}>
            <ChevronLeft size={18} color={theme.color.textDay} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        
        {onSettings ? (
          <TouchableOpacity style={styles.button} onPress={onSettings} activeOpacity={0.8}>
            <Settings size={18} color={theme.color.textDay} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.color.slate[200],
    backgroundColor: '#FFFFFF',
  },
  placeholder: {
    width: 36,
    height: 36,
  },
  titleContainer: {
    marginTop: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.xl.fontSize,
    fontWeight: '600',
    color: theme.color.textDay,
  },
});
