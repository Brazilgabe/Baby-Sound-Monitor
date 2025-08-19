import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bluetooth, Wifi } from 'lucide-react-native';
import { theme } from '@/src/theme';

interface ConnectionPillProps {
  conn: "wifi" | "bt" | null;
}

export function ConnectionPill({ conn }: ConnectionPillProps) {
  if (!conn) return null;
  
  const label = conn === "bt" ? "Bluetooth" : "Wi‑Fi/Data";
  const Icon = conn === "bt" ? Bluetooth : Wifi;
  
  return (
    <View style={styles.pill}>
      <Icon size={14} color={theme.color.slate[700]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: theme.color.slate[100],
    borderWidth: 1,
    borderColor: theme.color.slate[200],
  },
  label: {
    fontSize: 12,
    color: theme.color.slate[700],
    fontWeight: '500',
  },
});
