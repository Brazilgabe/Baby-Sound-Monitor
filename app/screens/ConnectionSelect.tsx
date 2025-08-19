import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wifi, Bluetooth } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';
import { Header } from '@/components/ui/Header';
import { OptionCard } from '@/components/ui/OptionCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

interface ConnectionSelectProps {
  onNext: (choice: "wifi" | "bt") => void;
}

export default function ConnectionSelect({ onNext }: ConnectionSelectProps) {
  const [choice, setChoice] = useState<"wifi" | "bt" | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Choose the connection that fits your setup.
        </Text>
        
        <View style={styles.options}>
          <OptionCard
            icon={<Wifi size={24} color={theme.color.primary} />}
            title="Wi‑Fi or Data"
            desc="Best reliability and range. Works anywhere your phones have internet."
            selected={choice === "wifi"}
            onPress={() => setChoice("wifi")}
            badge="Recommended"
          />
          
          <OptionCard
            icon={<Bluetooth size={24} color={theme.color.slate[600]} />}
            title="Bluetooth"
            desc="Simple nearby connection. Good when both phones are in the same room."
            selected={choice === "bt"}
            onPress={() => setChoice("bt")}
          />
        </View>
        
        <View style={styles.bottom}>
          <PrimaryButton
            disabled={!choice}
            onPress={() => choice && onNext(choice)}
          >
            Continue
          </PrimaryButton>
          
          <Text style={styles.footer}>
            You can change this later in Settings.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.bgDay,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    color: theme.color.slate[600],
    fontSize: theme.typography.sm.fontSize,
  },
  options: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  bottom: {
    marginTop: 'auto',
    paddingTop: theme.spacing.md,
  },
  footer: {
    fontSize: 13,
    color: theme.color.slate[500],
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});
