import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { QrCode, Camera } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';
import { Header } from '@/components/ui/Header';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ConnectionPill } from '@/components/ui/ConnectionPill';

interface QRScannerProps {
  onBack: () => void;
  onUseCode: () => void;
  onConnected: () => void;
  conn: "wifi" | "bt";
}

export default function QRScanner({ onBack, onUseCode, onConnected, conn }: QRScannerProps) {
  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={onBack} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Scan the QR on the other phone</Text>
          <ConnectionPill conn={conn} />
        </View>
        
        <View style={styles.scannerContainer}>
          <View style={styles.scannerFrame} />
          <QrCode size={56} color={theme.color.slate[400]} />
          <View style={styles.cameraLabel}>
            <Camera size={14} color={theme.color.slate[600]} />
            <Text style={styles.cameraText}>Camera preview</Text>
          </View>
        </View>
        
        <View style={styles.bottom}>
          <PrimaryButton onPress={onConnected}>
            Simulate scan
          </PrimaryButton>
          
          <View style={styles.codeOption}>
            <TouchableOpacity onPress={onUseCode}>
              <Text style={styles.codeText}>
                Enter code instead
              </Text>
            </TouchableOpacity>
          </View>
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
  scannerContainer: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.color.slate[300],
    backgroundColor: theme.color.slate[50],
    height: 288, // 72 * 4 (72 is 18rem in Tailwind)
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  scannerFrame: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.color.slate[300],
  },
  cameraLabel: {
    position: 'absolute',
    bottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cameraText: {
    fontSize: 12,
    color: theme.color.slate[600],
  },
  bottom: {
    marginTop: 'auto',
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  codeOption: {
    alignItems: 'center',
  },
  codeText: {
    fontSize: theme.typography.sm.fontSize,
    color: theme.color.slate[700],
    paddingVertical: theme.spacing.sm,
  },
});
