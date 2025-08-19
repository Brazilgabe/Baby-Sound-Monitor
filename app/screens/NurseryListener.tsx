import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';
import { Header } from '@/components/ui/Header';
import { ConnectionPill } from '@/components/ui/ConnectionPill';
import { ModeBadge } from '@/components/ui/ModeBadge';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

interface NurseryListenerProps {
  onBackToRole?: () => void;
  conn: "wifi" | "bt" | null;
  mode: "audio" | "video";
}

export default function NurseryListener({ onBackToRole, conn, mode }: NurseryListenerProps) {
  const [night, setNight] = useState(true);
  const [active, setActive] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: night ? theme.color.bgNight : theme.color.bgDay }]}>
      <Header onBack={onBackToRole} />
      
      <View style={styles.connectionInfo}>
        <ConnectionPill conn={conn} />
        <ModeBadge mode={mode} />
      </View>
      
      <View style={styles.content}>
        <View style={[styles.listenerCard, { 
          backgroundColor: night ? theme.color.cardNight : theme.color.cardDay,
          borderColor: night ? theme.color.borderDark : theme.color.border 
        }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: night ? theme.color.textNight : theme.color.textDay }]}>
              {active ? "Listening" : "Ready to listen"}
            </Text>
            <TouchableOpacity
              style={[styles.modeToggle, {
                borderColor: night ? theme.color.borderDark : theme.color.border,
                backgroundColor: night ? theme.color.bgNight : '#FFFFFF',
              }]}
              onPress={() => setNight(!night)}
            >
              <Text style={[styles.modeToggleText, { color: night ? theme.color.textNight : theme.color.textDay }]}>
                {night ? "Night" : "Day"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.placeholder, { 
            backgroundColor: night ? theme.color.bgNight : theme.color.slate[50] 
          }]} />
          
          <Text style={[styles.instruction, { color: night ? theme.color.textNight : theme.color.textDay }]}>
            Place phone near the crib with the mic facing the room.
          </Text>
        </View>
        
        <View style={styles.bottom}>
          <PrimaryButton onPress={() => setActive(!active)}>
            {active ? "Stop listening" : "Start listening"}
          </PrimaryButton>
          
          <Text style={[styles.footer, { color: night ? theme.color.textNight : theme.color.textDay }]}>
            When active, the screen will dim automatically.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  connectionInfo: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  listenerCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: theme.typography.sm.fontSize,
    opacity: 0.8,
  },
  modeToggle: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  placeholder: {
    marginTop: theme.spacing.md,
    height: 112, // 28 * 4 (28 is 7rem in Tailwind)
    borderRadius: theme.borderRadius.lg,
  },
  instruction: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sm.fontSize,
    opacity: 0.8,
  },
  bottom: {
    marginTop: 'auto',
    paddingTop: theme.spacing.md,
  },
  footer: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});
