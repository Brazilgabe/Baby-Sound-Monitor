import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession, ConnectionType, StreamMode } from '@/src/store/useSession';

interface PairingSelectProps {
  conn: ConnectionType;
  mode: StreamMode;
  onModeChange: (mode: StreamMode) => void;
  onBack: () => void;
  onNext: (method: "qr" | "code") => void;
}

export default function PairingSelect({ 
  conn, 
  mode, 
  onModeChange, 
  onBack, 
  onNext 
}: PairingSelectProps) {
  const { currentSession, connectionStatus, isConnected } = useSession();
  const [selectedMode, setSelectedMode] = useState<StreamMode>(mode);

  const handleModeChange = (newMode: StreamMode) => {
    setSelectedMode(newMode);
    onModeChange(newMode);
  };

  const handleNext = (method: "qr" | "code") => {
    if (!isConnected) {
      Alert.alert(
        'Not Connected',
        'Please wait for the connection to be established before proceeding.',
        [{ text: 'OK' }]
      );
      return;
    }
    onNext(method);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.connectionInfo}>
            <View style={[styles.connectionIcon, { backgroundColor: getConnectionTypeColor() + '20' }]}>
              <Ionicons name={getConnectionTypeIcon()} size={24} color={getConnectionTypeColor()} />
            </View>
            <Text style={styles.connectionText}>{getConnectionTypeText()}</Text>
          </View>
          
          <Text style={styles.title}>Choose Pairing Method</Text>
          <Text style={styles.subtitle}>
            Select how you want to connect your devices
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Stream Mode Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stream Mode</Text>
          <View style={styles.modeOptions}>
            <TouchableOpacity
              style={[
                styles.modeOption,
                selectedMode === 'audio' && styles.modeOptionSelected
              ]}
              onPress={() => handleModeChange('audio')}
            >
              <Ionicons 
                name="mic" 
                size={20} 
                color={selectedMode === 'audio' ? '#4C6EF5' : '#64748B'} 
              />
              <Text style={[
                styles.modeOptionText,
                selectedMode === 'audio' && styles.modeOptionTextSelected
              ]}>
                Audio Only
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeOption,
                selectedMode === 'audio+video' && styles.modeOptionSelected
              ]}
              onPress={() => handleModeChange('audio+video')}
            >
              <Ionicons 
                name="videocam" 
                size={20} 
                color={selectedMode === 'audio+video' ? '#4C6EF5' : '#64748B'} 
              />
              <Text style={[
                styles.modeOptionText,
                selectedMode === 'audio+video' && styles.modeOptionTextSelected
              ]}>
                Audio + Video
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pairing Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pairing Method</Text>
          
          <TouchableOpacity
            style={styles.pairingOption}
            onPress={() => handleNext('qr')}
            disabled={!isConnected}
          >
            <View style={styles.pairingIcon}>
              <Ionicons name="qr-code" size={32} color="#4C6EF5" />
            </View>
            <View style={styles.pairingContent}>
              <Text style={styles.pairingTitle}>Scan QR Code</Text>
              <Text style={styles.pairingDescription}>
                Point your camera at the QR code on the other device
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pairingOption}
            onPress={() => handleNext('code')}
            disabled={!isConnected}
          >
            <View style={styles.pairingIcon}>
              <Ionicons name="keypad" size={32} color="#8B5CF6" />
            </View>
            <View style={styles.pairingContent}>
              <Text style={styles.pairingTitle}>Enter Code</Text>
              <Text style={styles.pairingDescription}>
                Type the 6-digit code shown on the other device
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        {currentSession && (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionInfoTitle}>Session Info</Text>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Room ID:</Text>
              <Text style={styles.sessionValue}>{currentSession.roomId}</Text>
            </View>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Join Key:</Text>
              <Text style={styles.sessionValue}>{currentSession.joinKey}</Text>
            </View>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Mode:</Text>
              <Text style={styles.sessionValue}>{selectedMode}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {!isConnected 
            ? 'Establishing connection...' 
            : 'Choose your preferred pairing method to continue'
          }
        </Text>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1222',
    marginBottom: 16,
  },
  modeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  modeOptionSelected: {
    borderColor: '#4C6EF5',
    backgroundColor: '#4C6EF5' + '10',
  },
  modeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 8,
  },
  modeOptionTextSelected: {
    color: '#4C6EF5',
  },
  pairingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pairingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pairingContent: {
    flex: 1,
  },
  pairingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1222',
    marginBottom: 4,
  },
  pairingDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  sessionInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1222',
    marginBottom: 16,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  sessionValue: {
    fontSize: 14,
    color: '#0C1222',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
