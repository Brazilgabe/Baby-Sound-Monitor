import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Phone, Baby } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';
import { Header } from '@/components/ui/Header';
import { OptionCard } from '@/components/ui/OptionCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

interface RoleSelectProps {
  onNext: (role: "parent" | "baby") => void;
  onBack: () => void;
}

export default function RoleSelect({ onNext, onBack }: RoleSelectProps) {
  const [role, setRole] = useState<"parent" | "baby" | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={onBack} />
      
      <View style={styles.content}>
        <View style={styles.options}>
          <OptionCard
            icon={<Phone size={24} color={theme.color.primary} />}
            title="Parent"
            desc="Get alerts and listen from anywhere. Designed for one‑hand use."
            selected={role === "parent"}
            onPress={() => setRole("parent")}
          />
          
          <OptionCard
            icon={<Baby size={24} color={theme.color.slate[600]} />}
            title="Nursery Listener"
            desc="Stays in the baby room and listens. Low‑light friendly."
            selected={role === "baby"}
            onPress={() => setRole("baby")}
          />
        </View>
        
        <View style={styles.bottom}>
          <PrimaryButton
            disabled={!role}
            onPress={() => role && onNext(role)}
          >
            Continue
          </PrimaryButton>
          
          <Text style={styles.footer}>
            You can switch roles anytime.
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
  options: {
    marginTop: theme.spacing.sm,
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
