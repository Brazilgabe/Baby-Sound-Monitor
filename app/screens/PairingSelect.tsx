import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { QrCode, Keyboard } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';
import { Header } from '@/components/ui/Header';
import { OptionCard } from '@/components/ui/OptionCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ModeChips } from '@/components/ui/ModeChips';
import { ConnectionPill } from '@/components/ui/ConnectionPill';

interface PairingSelectProps {
  conn: "wifi" | "bt";
  mode: "audio" | "video";
  onModeChange: (mode: "audio" | "video") => void;
  onNext: (method: "qr" | "code") => void;
  onBack: () => void;
}

export default function PairingSelect({ conn, mode, onModeChange, onNext, onBack }: PairingSelectProps) {
  const [method, setMethod] = useState<"qr" | "code" | null>(conn === "wifi" ? "qr" : "code");
  const recommended = conn === "wifi" ? "qr" : "code";

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={onBack} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Pair your devices</Text>
          <ConnectionPill conn={conn} />
        </View>
        
        <View style={styles.modeSection}>
          <ModeChips mode={mode} onChange={onModeChange} />
        </View>
        
        <View style={styles.options}>
          <OptionCard
            icon={<QrCode size={24} color={theme.color.primary} />}
            title="Scan QR code"
            desc="Fast pairing with your camera. Recommended for Wi‑Fi/Data."
            selected={method === "qr"}
            onPress={() => setMethod("qr")}
            badge={recommended === "qr" ? "Recommended" : undefined}
          />
          
          <OptionCard
            icon={<Keyboard size={24} color={theme.color.slate[600]} />}
            title="Enter 6‑digit code"
            desc="Show code on the other phone and enter here. Best for Bluetooth."
            selected={method === "code"}
            onPress={() => setMethod("code")}
            badge={recommended === "code" ? "Recommended" : undefined}
          />
        </View>
        
        <View style={styles.bottom}>
          <PrimaryButton
            disabled={!method}
            onPress={() => method && onNext(method)}
          >
            Continue
          </PrimaryButton>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    fontSize: theme.typography.sm.fontSize,
    color: theme.color.slate[600],
  },
  modeSection: {
    marginTop: theme.spacing.md,
  },
  options: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  bottom: {
    marginTop: 'auto',
    paddingTop: theme.spacing.md,
  },
});
