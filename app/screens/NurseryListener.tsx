import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession, ConnectionType, StreamMode } from '@/src/store/useSession';
import { LocalSignaling } from '@/src/webrtc/localSignaling';
import { WebRTCSession } from '@/src/webrtc/WebRTCSession';
import { QRCodeScanner } from '@/src/components/QRCodeScanner';

interface NurseryListenerProps {
  onBackToRole: () => void;
  conn: ConnectionType;
  mode: StreamMode;
}

export default function NurseryListener({ onBackToRole, conn, mode }: NurseryListenerProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [offerQR, setOfferQR] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  const [localSignaling, setLocalSignaling] = useState<LocalSignaling | null>(null);
  const { currentSession, connectionStatus, isConnected } = useSession();

  useEffect(() => {
    // Simulate stream quality changes
    if (isStreaming) {
      const interval = setInterval(() => {
        const quality = Math.random();
        if (quality > 0.8) setStreamQuality('good');
        else if (quality > 0.5) setStreamQuality('fair');
        else setStreamQuality('poor');
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  // Android QR functionality
  useEffect(() => {
    if (Platform.OS === 'android' && conn === 'bt' && !offerQR) {
      const initAndroidQR = async () => {
        try {
          const session = new WebRTCSession();
          const signaling = new LocalSignaling(session);
          setLocalSignaling(signaling);
          
          const result = await signaling.startHost(mode === 'audio' ? 'audio' : 'video');
          setOfferQR(result.offerQR);
        } catch (error) {
          Alert.alert('Error', 'Failed to initialize Android QR: ' + error);
        }
      };
      
      initAndroidQR();
    }
  }, [conn, mode, offerQR]);

  const handleScanParentAnswer = (scannedData: string) => {
    if (localSignaling) {
      try {
        localSignaling.acceptAnswer(scannedData);
        setShowScanner(false);
        setIsStreaming(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to accept answer: ' + error);
      }
    }
  };

  const handleStartStreaming = () => {
    setIsStreaming(true);
  };

  const handleStopStreaming = () => {
    setIsStreaming(false);
  };

  const handleBack = () => {
    if (isStreaming) {
      Alert.alert(
        'Stop Streaming',
        'Are you sure you want to stop streaming?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop', style: 'destructive', onPress: onBackToRole }
        ]
      );
    } else {
      onBackToRole();
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

  const getQualityColor = () => {
    switch (streamQuality) {
      case 'good': return '#10B981';
      case 'fair': return '#F59E0B';
      case 'poor': return '#EF4444';
    }
  };

  const getQualityText = () => {
    switch (streamQuality) {
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
    }
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
          
          <Text style={styles.title}>Nursery Listener</Text>
          <Text style={styles.subtitle}>
            Streaming audio from the nursery
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

        {/* Stream Status */}
        <View style={styles.streamContainer}>
          <Text style={styles.streamTitle}>Stream Status</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: isStreaming ? '#10B981' : '#6B7280' }]} />
              <Text style={styles.statusLabel}>
                {isStreaming ? 'Streaming' : 'Stopped'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <View style={[styles.qualityDot, { backgroundColor: getQualityColor() }]} />
              <Text style={styles.qualityLabel}>Quality: {getQualityText()}</Text>
            </View>
          </View>
          
          {isStreaming && (
            <View style={styles.streamInfo}>
              <Text style={styles.streamInfoText}>
                {mode === 'audio' 
                  ? 'Audio is being streamed to the parent device'
                  : 'Audio and video are being streamed to the parent device'
                }
              </Text>
            </View>
          )}
        </View>

        {/* Session Info */}
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
              <Text style={styles.sessionValue}>{getModeText()}</Text>
            </View>
          </View>
        )}

        {/* Android QR Functionality */}
        {Platform.OS === 'android' && conn === 'bt' && offerQR && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Offer QR Code</Text>
            <Text style={styles.qrInstructions}>
              Parent device should scan this QR code to join
            </Text>
            <View style={styles.qrCode}>
              <Text style={styles.qrText}>{offerQR.substring(0, 50)}...</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.scanButton} 
              onPress={() => setShowScanner(true)}
            >
              <Ionicons name="qr-code" size={20} color="white" />
              <Text style={styles.scanButtonText}>Scan Parent Answer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controls}>
          {!isStreaming ? (
            <TouchableOpacity 
              style={[styles.controlButton, styles.startButton]} 
              onPress={handleStartStreaming}
            >
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.startButtonText}>Start Streaming</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.controlButton, styles.stopButton]} 
              onPress={handleStopStreaming}
            >
              <Ionicons name="stop" size={24} color="white" />
              <Text style={styles.stopButtonText}>Stop Streaming</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRCodeScanner
          onScan={(data) => handleScanParentAnswer(data.roomId)}
          onClose={() => setShowScanner(false)}
        />
      )}
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
  streamContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  streamTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1222',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  qualityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  qualityLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  streamInfo: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  streamInfoText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  sessionInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
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
  qrContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C1222',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrInstructions: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  qrCode: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  qrText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4C6EF5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
