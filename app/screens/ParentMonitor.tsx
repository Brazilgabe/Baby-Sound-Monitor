import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession, ConnectionType, StreamMode } from '@/src/store/useSession';

interface ParentMonitorProps {
  onBack: () => void;
  conn: ConnectionType;
  mode: StreamMode;
}

export default function ParentMonitor({ onBack, conn, mode }: ParentMonitorProps) {
  const [isListening, setIsListening] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [lastNoise, setLastNoise] = useState<Date | null>(null);
  const { currentSession, connectionStatus, isConnected } = useSession();

  useEffect(() => {
    // Simulate noise detection
    if (isListening) {
      const interval = setInterval(() => {
        const level = Math.random() * 100;
        setNoiseLevel(level);
        
        if (level > 70) {
          setLastNoise(new Date());
          // In a real app, you'd send a notification here
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isListening]);

  const handleStartListening = () => {
    setIsListening(true);
  };

  const handleStopListening = () => {
    setIsListening(false);
    setNoiseLevel(0);
  };

  const handleBack = () => {
    if (isListening) {
      Alert.alert(
        'Stop Listening',
        'Are you sure you want to stop listening?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop', style: 'destructive', onPress: onBack }
        ]
      );
    } else {
      onBack();
    }
  };

  const getConnectionTypeText = () => {
    return conn === 'wifi' ? 'Wi-Fi or Data' : 'Bluetooth';
  };

  const getConnectionTypeIcon = () => {
    return conn === 'wifi' ? 'wifi' : 'bluetooth';
  };

  const getConnectionTypeColor = () => {
    return conn === 'wifi' ? '#4C6EF5' : '#8B5CF6';
  };

  const getModeText = () => {
    return mode === 'audio' ? 'Audio Only' : 'Audio + Video';
  };

  const getModeIcon = () => {
    return mode === 'audio' ? 'mic' : 'videocam';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.connectionInfo}>
            <View style={[styles.connectionIcon, { backgroundColor: getConnectionTypeColor() + '20' }]}>
              <Ionicons name={getConnectionTypeIcon()} size={24} color={getConnectionTypeColor()} />
            </View>
            <Text style={styles.connectionText}>{getConnectionTypeText()}</Text>
          </View>
          
          <Text style={styles.title}>Parent Monitor</Text>
          <Text style={styles.subtitle}>
            Listening for sounds from the nursery
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Mode and Connection Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name={getModeIcon()} size={20} color="#4C6EF5" />
              <Text style={styles.infoLabel}>Mode</Text>
              <Text style={styles.infoValue}>{getModeText()}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="wifi" size={20} color="#10B981" />
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
        </View>

        {/* Noise Level Display */}
        <View style={styles.noiseContainer}>
          <Text style={styles.noiseTitle}>Current Noise Level</Text>
          
          <View style={styles.noiseMeter}>
            <View style={styles.noiseBar}>
              <View 
                style={[
                  styles.noiseLevel, 
                  { 
                    width: `${noiseLevel}%`,
                    backgroundColor: noiseLevel > 70 ? '#EF4444' : noiseLevel > 40 ? '#F59E0B' : '#10B981'
                  }
                ]} 
              />
            </View>
            <Text style={styles.noiseValue}>{Math.round(noiseLevel)}%</Text>
          </View>
          
          <Text style={styles.noiseDescription}>
            {noiseLevel > 70 ? 'High noise detected!' : 
             noiseLevel > 40 ? 'Moderate activity' : 'Quiet'}
          </Text>
        </View>

        {/* Last Noise Alert */}
        {lastNoise && (
          <View style={styles.alertContainer}>
            <Ionicons name="notifications" size={24} color="#EF4444" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Noise Alert</Text>
              <Text style={styles.alertTime}>
                Last detected: {lastNoise.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controls}>
          {!isListening ? (
            <TouchableOpacity 
              style={[styles.controlButton, styles.startButton]} 
              onPress={handleStartListening}
            >
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.startButtonText}>Start Listening</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.controlButton, styles.stopButton]} 
              onPress={handleStopListening}
            >
              <Ionicons name="stop" size={24} color="white" />
              <Text style={styles.stopButtonText}>Stop Listening</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    alignItems: 'center',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  connectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C1222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C1222',
  },
  noiseContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noiseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1222',
    marginBottom: 20,
  },
  noiseMeter: {
    width: '100%',
    marginBottom: 16,
  },
  noiseBar: {
    width: '100%',
    height: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  noiseLevel: {
    height: '100%',
    borderRadius: 10,
  },
  noiseValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C1222',
    textAlign: 'center',
  },
  noiseDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 14,
    color: '#DC2626',
  },
  controls: {
    marginTop: 'auto',
    paddingBottom: 32,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
