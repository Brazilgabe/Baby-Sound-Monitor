import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { theme } from '@/src/theme';

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  selected?: boolean;
  onPress?: () => void;
  badge?: string;
}

export function OptionCard({ icon, title, desc, selected, onPress, badge }: OptionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, selected && styles.iconContainerSelected]}>
        {icon}
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, selected && styles.titleSelected]}>
            {title}
          </Text>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.description, selected && styles.descriptionSelected]}>
          {desc}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.color.slate[200],
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  cardSelected: {
    borderColor: theme.color.primary,
    backgroundColor: `${theme.color.primary}0D`, // 5% opacity
    shadowColor: theme.color.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.color.slate[100],
  },
  iconContainerSelected: {
    backgroundColor: `${theme.color.primary}26`, // 15% opacity
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.base.fontSize,
    fontWeight: '500',
    color: theme.color.textDay,
  },
  titleSelected: {
    color: theme.color.primary,
  },
  description: {
    fontSize: theme.typography.sm.fontSize,
    color: theme.color.slate[600],
    marginTop: 2,
    opacity: 0.7,
  },
  descriptionSelected: {
    color: theme.color.slate[700],
  },
  badge: {
    backgroundColor: theme.color.emerald[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: theme.color.emerald[700],
    fontWeight: '500',
  },
});
