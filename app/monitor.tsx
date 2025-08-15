import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSession } from '@/src/store/useSession';
import { AudioMonitor } from '@/src/audio/monitor';
import { notifyListener } from '@/src/notify';
import { LevelBar } from '@/components/LevelBar';
import { ThresholdSlider } from '@/components/ThresholdSlider';

export default function MonitorScreen() {
  const { threshold, setThreshold } = useSession();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [noiseDetected, setNoiseDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioMonitor] = useState(() => new AudioMonitor());

  useEffect(() => {
    const unsubscribe = audioMonitor.onThresholdExceeded(async () => {
      setNoiseDetected(true);
      // In a real app, you'd send a notification here
      console.log('Noise threshold exceeded!');
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = audioMonitor.onLevelUpdate(setAudioLevel);
    return unsubscribe;
  }, []);

  const handleStartStop = async () => {
    if (isMonitoring) {
      await audioMonitor.stop();
      setIsMonitoring(false);
    } else {
      try {
        await audioMonitor.start(threshold);
        setIsMonitoring(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to start monitoring. Please check microphone permissions.');
      }
    }
  };

  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold);
    console.log('Threshold updated to:', newThreshold);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Monitor</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.levelContainer}>
          <Text style={styles.sectionTitle}>Audio Level</Text>
          <LevelBar level={audioLevel} threshold={threshold} />
          <Text style={styles.levelText}>
            {Math.round(audioLevel * 100)}%
          </Text>
        </View>

        <View style={styles.thresholdContainer}>
          <Text style={styles.sectionTitle}>
            Threshold: {Math.round(threshold * 100)}%
          </Text>
          <ThresholdSlider 
            value={threshold}
            onValueChange={handleThresholdChange}
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.startButton, 
            isMonitoring ? styles.stopButton : styles.startButtonActive
          ]}
          onPress={handleStartStop}
        >
          <Text style={styles.startButtonText}>
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Text>
        </TouchableOpacity>

        {isMonitoring && (
          <Text style={styles.statusText}>
            Monitoring active
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 32,
  },
  levelContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  levelText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  thresholdContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  startButton: {
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonActive: {
    backgroundColor: '#3b82f6',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusText: {
    fontSize: 16,
    color: '#10b981',
    textAlign: 'center',
    fontWeight: '500',
  },
});