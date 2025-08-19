import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '@/src/theme';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export function PrimaryButton({ children, onPress, disabled }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, disabled && styles.textDisabled]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.color.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: theme.color.slate[300],
  },
  text: {
    color: '#FFFFFF',
    fontSize: theme.typography.base.fontSize,
    fontWeight: '500',
    textAlign: 'center',
  },
  textDisabled: {
    color: theme.color.slate[500],
  },
});
