import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/src/store/useSession';

export default function RoleScreen() {
  const { setRole } = useSession();

  const handleRoleSelect = (role: 'monitor' | 'listener') => {
    setRole(role);
    router.push(`/${role}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Baby Sound Monitor</Text>
      <Text style={styles.subtitle}>Choose your role</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.monitorButton]}
          onPress={() => handleRoleSelect('monitor')}
        >
          <Text style={styles.buttonText}>Monitor</Text>
          <Text style={styles.buttonSubtext}>Record and detect sounds</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.listenerButton]}
          onPress={() => handleRoleSelect('listener')}
        >
          <Text style={styles.buttonText}>Listener</Text>
          <Text style={styles.buttonSubtext}>Receive notifications</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 48,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monitorButton: {
    backgroundColor: '#3b82f6',
  },
  listenerButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#e5e7eb',
  },
});