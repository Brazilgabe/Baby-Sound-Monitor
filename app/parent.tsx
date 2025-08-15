import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, QrCode, Camera, Headphones, Settings, Volume2, VolumeX } from 'lucide-react-native';
import { useSession, SessionState, StreamMode } from '@/src/store/useSession';
import { TransportFactory, BaseTransport } from '@/src/transport/RealtimeTransport';
import { QRCodeGenerator } from '@/src/utils/QRCodeUtils';
import { notificationService } from '@/src/notify/NotificationService';
import { LevelBar } from '@/components/LevelBar';

const { width, height } = Dimensions.get('window');

export default function ParentScreen() {
  const { 
    currentSession, 
    sessionState, 
    streamMode, 
    setStreamMode,
    setSessionState,
    setIsConnected,
    resetSession
  } = useSession();

  const [isConnected, setIsConnectedLocal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const transportRef = useRef<BaseTransport | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Listen for notification responses
    const subscription = notificationService.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.type === 'noise_detected') {
        // User tapped on noise notification, ensure we're connected
        if (!isConnected) {
          // Try to reconnect or show connection prompt
          Alert.alert('Noise Detected', 'Tap to view live stream');
        }
      }
    });

    return () => {
      subscription.remove();
      cleanup();
    };
  }, [isConnected]);

  const startQRScanning = async () => {
    try {
      setIsScanning(true);
      setConnectionError(null);
      
      // In a real app, this would open the camera for QR scanning
      // For now, we'll simulate a successful scan
      await simulateQRScan();
      
    } catch (error) {
      console.error('Failed to start QR scanning:', error);
      setConnectionError('Failed to start camera for QR scanning');
    }
  };

  const simulateQRScan = async () => {
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful scan with mock data
    const mockQRData = {
      roomId: 'room_1234567890_abc123def',
      joinKey: 'key_abc123def456',
      mode: 'audio' as StreamMode,
      connectivity: 'nearby' as const,
      timestamp: Date.now(),
    };

    await connectToSession(mockQRData);
    setIsScanning(false);
  };

  const connectToSession = async (sessionData: any) => {
    try {
      setSessionState('connecting');
      setConnectionError(null);

      // Create transport
      transportRef.current = TransportFactory.create(
        sessionData.connectivity,
        sessionData.roomId,
        sessionData.joinKey,
        {
          onMessage: handleTransportMessage,
          onConnect: handleTransportConnect,
          onDisconnect: handleTransportDisconnect,
          onError: handleTransportError,
        }
      );

      // Connect to transport
      await transportRef.current.connect();
      
      // Send hello message to listener
      if (transportRef.current.isReady()) {
        transportRef.current.send({
          type: 'parent:hello',
          roomId: sessionData.roomId,
          joinKey: sessionData.joinKey,
        });
      }

      setSessionState('streaming');
      setIsConnected(true);
      setIsConnectedLocal(true);
      console.log('[Parent] Connected to session');

    } catch (error) {
      console.error('Failed to connect to session:', error);
      setConnectionError('Failed to connect to listener device');
      setSessionState('disconnected');
    }
  };

  const handleTransportMessage = (message: any) => {
    console.log('[Parent] Transport message:', message);
    
    if (message.type === 'audio') {
      // Handle incoming audio data
      // In a real app, this would play the audio
      console.log('[Parent] Received audio data');
    } else if (message.type === 'video') {
      // Handle incoming video data
      // In a real app, this would display the video
      console.log('[Parent] Received video data');
    } else if (message.type === 'noise:detected') {
      // Handle noise detection
      handleNoiseDetected(message.level);
    }
  };

  const handleTransportConnect = () => {
    console.log('[Parent] Transport connected');
  };

  const handleTransportDisconnect = () => {
    console.log('[Parent] Transport disconnected');
    setIsConnected(false);
    setIsConnectedLocal(false);
    setSessionState('disconnected');
    
    // Attempt reconnection
    attemptReconnection();
  };

  const handleTransportError = (error: string) => {
    console.error('[Parent] Transport error:', error);
    setConnectionError(error);
    setSessionState('disconnected');
  };

  const handleNoiseDetected = (level: number) => {
    // Update audio level
    setAudioLevel(level / 100); // Assuming level is 0-100
    
    // Send local notification if app is in background
    notificationService.sendNoiseAlert(level, currentSession?.roomId || '');
  };

  const attemptReconnection = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    let attempts = 0;
    const maxAttempts = 5;
    
    const attempt = async () => {
      attempts++;
      console.log(`[Parent] Reconnection attempt ${attempts}/${maxAttempts}`);
      
      if (attempts > maxAttempts) {
        setConnectionError('Failed to reconnect after multiple attempts');
        return;
      }

      try {
        // Wait before attempting reconnection
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        
        if (transportRef.current) {
          await transportRef.current.connect();
          setIsConnected(true);
          setIsConnectedLocal(true);
          setSessionState('streaming');
          setConnectionError(null);
          console.log('[Parent] Reconnection successful');
        }
      } catch (error) {
        console.error(`[Parent] Reconnection attempt ${attempts} failed:`, error);
        // Schedule next attempt
        reconnectTimeoutRef.current = setTimeout(attempt, 2000 * attempts);
      }
    };

    reconnectTimeoutRef.current = setTimeout(attempt, 2000);
  };

  const toggleStreamMode = () => {
    const newMode = streamMode === 'audio' ? 'audio+video' : 'audio';
    setStreamMode(newMode);
    
    // Notify listener of mode change
    if (transportRef.current && transportRef.current.isReady()) {
      transportRef.current.send({
        type: 'mode:change',
        roomId: currentSession?.roomId || '',
        joinKey: currentSession?.joinKey || '',
        mode: newMode,
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real app, this would mute/unmute audio playback
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // In a real app, this would toggle fullscreen video
  };

  const disconnect = () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => {
          cleanup();
          router.back();
        }},
      ]
    );
  };

  const cleanup = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (transportRef.current) {
      transportRef.current.disconnect();
      transportRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnectedLocal(false);
    setSessionState('disconnected');
    resetSession();
  };

  const getStatusText = () => {
    if (connectionError) return connectionError;
    
    switch (sessionState) {
      case 'idle':
        return 'Ready to connect';
      case 'connecting':
        return 'Connecting to listener...';
      case 'streaming':
        return 'Connected - Receiving stream';
      case 'disconnected':
        return 'Disconnected from listener';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    if (connectionError) return '#ef4444';
    
    switch (sessionState) {
      case 'streaming':
        return '#10b981';
      case 'connecting':
        return '#f59e0b';
      case 'disconnected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (isFullscreen) {
    return (
      <View style={styles.fullscreenContainer}>
        <View style={styles.fullscreenHeader}>
          <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullscreen}>
            <Text style={styles.fullscreenButtonText}>Exit Fullscreen</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.videoContainer}>
          <Text style={styles.videoPlaceholder}>Video Stream (Fullscreen)</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Parent</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Status */}
        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          
          {currentSession && (
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionLabel}>Room ID: {currentSession.roomId.slice(-8)}</Text>
              <Text style={styles.sessionLabel}>Mode: {streamMode}</Text>
              <Text style={styles.sessionLabel}>Connectivity: {currentSession.connectivity}</Text>
            </View>
          )}
        </View>

        {/* QR Scanner */}
        {!isConnected && (
          <View style={styles.scannerCard}>
            <Text style={styles.sectionTitle}>Connect to Listener</Text>
            <Text style={styles.scannerDescription}>
              Scan the QR code displayed on the listener device to establish a connection
            </Text>
            
            <TouchableOpacity 
              style={[styles.scanButton, isScanning && styles.scanButtonActive]}
              onPress={startQRScanning}
              disabled={isScanning}
            >
              <QrCode size={24} color={isScanning ? '#ffffff' : '#3b82f6'} />
              <Text style={[styles.scanButtonText, isScanning && styles.scanButtonTextActive]}>
                {isScanning ? 'Scanning...' : 'Start QR Scanner'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stream Controls */}
        {isConnected && (
          <View style={styles.controlsCard}>
            <Text style={styles.sectionTitle}>Stream Controls</Text>
            
            {/* Mode Toggle */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Stream Mode:</Text>
              <TouchableOpacity 
                style={[styles.modeButton, streamMode === 'audio' && styles.modeButtonActive]}
                onPress={() => setStreamMode('audio')}
              >
                <Headphones size={16} color={streamMode === 'audio' ? '#ffffff' : '#6b7280'} />
                <Text style={[styles.modeButtonText, streamMode === 'audio' && styles.modeButtonTextActive]}>
                  Audio Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, streamMode === 'audio+video' && styles.modeButtonActive]}
                onPress={() => setStreamMode('audio+video')}
              >
                <Camera size={16} color={streamMode === 'audio+video' ? '#ffffff' : '#6b7280'} />
                <Text style={[styles.modeButtonText, streamMode === 'audio+video' && styles.modeButtonTextActive]}>
                  Audio + Video
                </Text>
              </TouchableOpacity>
            </View>

            {/* Audio Controls */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Audio:</Text>
              <TouchableOpacity 
                style={[styles.audioButton, isMuted && styles.audioButtonMuted]}
                onPress={toggleMute}
              >
                {isMuted ? <VolumeX size={16} color="#ffffff" /> : <Volume2 size={16} color="#ffffff" />}
                <Text style={styles.audioButtonText}>
                  {isMuted ? 'Unmute' : 'Mute'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Video Controls */}
            {streamMode === 'audio+video' && (
              <View style={styles.controlRow}>
                <Text style={styles.controlLabel}>Video:</Text>
                <TouchableOpacity 
                  style={styles.fullscreenButton}
                  onPress={toggleFullscreen}
                >
                  <Camera size={16} color="#ffffff" />
                  <Text style={styles.fullscreenButtonText}>Fullscreen</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Disconnect Button */}
            <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Audio Level Monitor */}
        {isConnected && (
          <View style={styles.audioCard}>
            <Text style={styles.sectionTitle}>Audio Level Monitor</Text>
            <LevelBar level={audioLevel} threshold={0.5} />
            <Text style={styles.audioLevelText}>
              Current Level: {Math.round(audioLevel * 100)}%
            </Text>
            <Text style={styles.audioNote}>
              Audio level shows incoming sound from the listener device
            </Text>
          </View>
        )}

        {/* Video Stream */}
        {isConnected && streamMode === 'audio+video' && (
          <View style={styles.videoCard}>
            <Text style={styles.sectionTitle}>Video Stream</Text>
            <View style={styles.videoContainer}>
              <Text style={styles.videoPlaceholder}>Video Stream from Listener</Text>
              <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullscreen}>
                <Text style={styles.fullscreenButtonText}>Enter Fullscreen</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sessionInfo: {
    gap: 8,
  },
  sessionLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  scannerCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scannerDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    gap: 12,
  },
  scanButtonActive: {
    backgroundColor: '#3b82f6',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  scanButtonTextActive: {
    color: '#ffffff',
  },
  controlsCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    minWidth: 80,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  audioButtonMuted: {
    backgroundColor: '#ef4444',
  },
  audioButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  fullscreenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  fullscreenButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disconnectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  audioCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  audioLevelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  audioNote: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  videoCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  videoPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
});
