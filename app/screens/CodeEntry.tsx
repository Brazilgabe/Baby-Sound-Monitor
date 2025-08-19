import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';
import { Header } from '@/components/ui/Header';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ConnectionPill } from '@/components/ui/ConnectionPill';

interface CodeEntryProps {
  onBack: () => void;
  onConnected: () => void;
  conn: "wifi" | "bt";
}

export default function CodeEntry({ onBack, onConnected, conn }: CodeEntryProps) {
  const [code, setCode] = useState("");
  const digits = Array.from({ length: 6 }, (_, i) => code[i] || "");

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={onBack} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Enter the 6‑digit code</Text>
          <ConnectionPill conn={conn} />
        </View>
        
        <View style={styles.digitsContainer}>
          {digits.map((digit, i) => (
            <View key={i} style={styles.digitBox}>
              <Text style={styles.digitText}>{digit}</Text>
            </View>
          ))}
        </View>
        
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
          inputMode="numeric"
          placeholder="123456"
          placeholderTextColor={theme.color.slate[400]}
        />
        
        <View style={styles.bottom}>
          <PrimaryButton
            disabled={code.length !== 6}
            onPress={onConnected}
          >
            Connect
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
  digitsContainer: {
    marginTop: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  digitBox: {
    width: 40,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.color.slate[300],
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    fontSize: theme.typography.xl.fontSize,
    fontWeight: '500',
    color: theme.color.textDay,
  },
  input: {
    marginTop: theme.spacing.xl,
    width: '100%',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.color.slate[300],
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.base.fontSize,
    color: theme.color.textDay,
  },
  bottom: {
    marginTop: 'auto',
    paddingTop: theme.spacing.md,
  },
});
