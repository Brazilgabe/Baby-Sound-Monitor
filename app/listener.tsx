import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Play, Square, Camera, Mic, Wifi, Globe, Settings } from 'lucide-react-native';
import { useSession, SessionState, StreamMode, Sensitivity, Connectivity } from '@/src/store/useSession';
import { StreamingService, VideoStreamingService } from '@/src/audio/StreamingService';
import { TransportFactory, BaseTransport } from '@/src/transport/RealtimeTransport';
import { QRCodeGenerator } from '@/src/utils/QRCodeUtils';
import { notificationService } from '@/src/notify/NotificationService';
import { LevelBar } from '@/components/LevelBar';
import { ThresholdSlider } from '@/components/ThresholdSlider';

export default function ListenerScreen() {
  const { 
    currentSession, 
    sessionState, 
    streamMode, 
    sensitivity, 
    connectivity,
    threshold,
    setStreamMode, 
    setSensitivity, 
    setConnectivity,
    setThreshold,
    setSessionState,
    setIsConnected,
    generateNewSession,
    resetSession
  } = useSession();

  const [isStreaming, setIsStreaming] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentCamera, setCurrentCamera] = useState<'back' | 'front'>('back');
  const [showQR, setShowQR] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');

  const streamingServiceRef = useRef<StreamingService | null>(null);
  const videoServiceRef = useRef<VideoStreamingService | null>(null);
  const transportRef = useRef<BaseTransport | null>(null);

  useEffect(() => {
    // Generate new session when component mounts
    if (!currentSession) {
      const newSession = generateNewSession();
      generateQRCode(newSession);
    } else {
      generateQRCode(currentSession);
    }

    return () => {
      cleanup();
    };
  }, []);

  const generateQRCode = (session: any) => {
    try {
      const deepLink = QRCodeGenerator.generateDeepLink(session);
      setQrCodeData(deepLink);
      setShowQR(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    }
  };

  const startStreaming = async () => {
    try {
      if (isStreaming) return;

      // Create streaming service
      streamingServiceRef.current = new StreamingService({
        onAudioLevel: (data) => {
          setAudioLevel(data.level);
          if (data.isNoiseDetected) {
            notificationService.sendNoiseAlert(data.level, currentSession?.roomId || '');
          }
        },
        onNoiseDetected: (level) => {
          notificationService.sendNoiseAlert(level, currentSession?.roomId || '');
        },
        onError: (error) => {
          console.error('Streaming error:', error);
          Alert.alert('Streaming Error', error);
        }
      }, sensitivity);

      // Start audio streaming
      await streamingServiceRef.current.startStreaming();

      // Start video streaming if mode includes video
      if (streamMode === 'audio+video') {
        videoServiceRef.current = new VideoStreamingService();
        try {
          await videoServiceRef.current.startVideoStream();
        } catch (videoError) {
          console.warn('Video streaming failed, continuing with audio only:', videoError);
          setStreamMode('audio');
        }
      }

      // Create and start transport
      if (currentSession) {
        transportRef.current = TransportFactory.create(
          connectivity,
          currentSession.roomId,
          currentSession.joinKey,
          {
            onMessage: handleTransportMessage,
            onConnect: handleTransportConnect,
            onDisconnect: handleTransportDisconnect,
            onError: handleTransportError,
          }
        );

        await transportRef.current.connect();
      }

      setIsStreaming(true);
      setSessionState('streaming');
      console.log('[Listener] Started streaming');

    } catch (error) {
      console.error('Failed to start streaming:', error);
      Alert.alert('Error', 'Failed to start streaming. Please check permissions.');
    }
  };

  const stopStreaming = async () => {
    try {
      setIsStreaming(false);
      setSessionState('disconnected');

      // Stop streaming services
      if (streamingServiceRef.current) {
        await streamingServiceRef.current.stopStreaming();
        streamingServiceRef.current = null;
      }

      if (videoServiceRef.current) {
        videoServiceRef.current.stopVideoStream();
        videoServiceRef.current = null;
      }

      // Stop transport
      if (transportRef.current) {
        transportRef.current.disconnect();
        transportRef.current = null;
      }

      console.log('[Listener] Stopped streaming');

    } catch (error) {
      console.error('Error stopping streaming:', error);
    }
  };

  const handleTransportMessage = (message: any) => {
    console.log('[Listener] Transport message:', message);
    
    if (message.type === 'parent:hello') {
      // Parent connected
      setIsConnected(true);
      setSessionState('streaming');
    }
  };

  const handleTransportConnect = () => {
    console.log('[Listener] Transport connected');
  };

  const handleTransportDisconnect = () => {
    console.log('[Listener] Transport disconnected');
    setIsConnected(false);
    setSessionState('disconnected');
  };

  const handleTransportError = (error: string) => {
    console.error('[Listener] Transport error:', error);
    Alert.alert('Connection Error', error);
  };

  const switchCamera = async () => {
    if (videoServiceRef.current && isStreaming) {
      try {
        await videoServiceRef.current.switchCamera();
        setCurrentCamera(currentCamera === 'back' ? 'front' : 'back');
      } catch (error) {
        console.error('Failed to switch camera:', error);
      }
    }
  };

  const toggleStreamMode = () => {
    const newMode = streamMode === 'audio' ? 'audio+video' : 'audio';
    setStreamMode(newMode);
    
    if (isStreaming && newMode === 'audio+video' && !videoServiceRef.current) {
      // Start video streaming
      startVideoStreaming();
    } else if (isStreaming && newMode === 'audio' && videoServiceRef.current) {
      // Stop video streaming
      videoServiceRef.current.stopVideoStream();
      videoServiceRef.current = null;
    }
  };

  const startVideoStreaming = async () => {
    try {
      videoServiceRef.current = new VideoStreamingService();
      await videoServiceRef.current.startVideoStream();
    } catch (error) {
      console.error('Failed to start video streaming:', error);
      setStreamMode('audio');
      Alert.alert('Video Error', 'Failed to start video streaming. Continuing with audio only.');
    }
  };

  const cleanup = () => {
    stopStreaming();
    resetSession();
  };

  const handleBack = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this monitoring session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Session', style: 'destructive', onPress: () => {
          cleanup();
          router.back();
        }},
      ]
    );
  };

  const getStatusText = () => {
    switch (sessionState) {
      case 'pairing':
        return 'Waiting for Parent to scan...';
      case 'connecting':
        return 'Parent connecting...';
      case 'streaming':
        return 'Parent connected - Streaming active';
      case 'disconnected':
        return 'Session ended - Start new session';
      default:
        return 'Ready to start';
    }
  };

  const getStatusColor = () => {
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Listener</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Session Status */}
        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Session Status</Text>
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
              <Text style={styles.sessionLabel}>Connectivity: {connectivity}</Text>
            </View>
          )}
        </View>

        {/* QR Code */}
        {showQR && currentSession && (
          <View style={styles.qrCard}>
            <Text style={styles.sectionTitle}>QR Code for Parent</Text>
            <View style={styles.qrContainer}>
              <Text style={styles.qrPlaceholder}>QR Code Here</Text>
              <Text style={styles.qrNote}>
                Parent scans this to connect
              </Text>
            </View>
            <Text style={styles.roomIdText}>
              Room: {currentSession.roomId.slice(-8)}
            </Text>
          </View>
        )}

        {/* Stream Controls */}
        <View style={styles.controlsCard}>
          <Text style={styles.sectionTitle}>Stream Controls</Text>
          
          {/* Mode Selection */}
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Stream Mode:</Text>
            <TouchableOpacity 
              style={[styles.modeButton, streamMode === 'audio' && styles.modeButtonActive]}
              onPress={() => setStreamMode('audio')}
            >
              <Mic size={16} color={streamMode === 'audio' ? '#ffffff' : '#6b7280'} />
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

          {/* Connectivity Selection */}
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Connectivity:</Text>
            <TouchableOpacity 
              style={[styles.connectivityButton, connectivity === 'nearby' && styles.connectivityButtonActive]}
              onPress={() => setConnectivity('nearby')}
            >
              <Wifi size={16} color={connectivity === 'nearby' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.connectivityButtonText, connectivity === 'nearby' && styles.connectivityButtonTextActive]}>
                Nearby
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.connectivityButton, connectivity === 'anywhere' && styles.connectivityButtonActive]}
              onPress={() => setConnectivity('anywhere')}
            >
              <Globe size={16} color={connectivity === 'anywhere' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.connectivityButtonText, connectivity === 'anywhere' && styles.connectivityButtonTextActive]}>
                Anywhere
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sensitivity Control */}
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Sensitivity:</Text>
            <View style={styles.sensitivityButtons}>
              {(['low', 'medium', 'high'] as Sensitivity[]).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.sensitivityButton, sensitivity === level && styles.sensitivityButtonActive]}
                  onPress={() => setSensitivity(level)}
                >
                  <Text style={[styles.sensitivityButtonText, sensitivity === level && styles.sensitivityButtonTextActive]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Start/Stop Button */}
          <TouchableOpacity
            style={[styles.streamButton, isStreaming ? styles.stopButton : styles.startButton]}
            onPress={isStreaming ? stopStreaming : startStreaming}
          >
            {isStreaming ? <Square size={24} color="#ffffff" /> : <Play size={24} color="#ffffff" />}
            <Text style={styles.streamButtonText}>
              {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Audio Level Monitor */}
        {isStreaming && (
          <View style={styles.audioCard}>
            <Text style={styles.sectionTitle}>Audio Level Monitor</Text>
            <LevelBar level={audioLevel} threshold={threshold} />
            <Text style={styles.audioLevelText}>
              Current Level: {Math.round(audioLevel * 100)}%
            </Text>
            <Text style={styles.thresholdText}>
              Threshold: {Math.round(threshold * 100)}%
            </Text>
            <ThresholdSlider 
              value={threshold}
              onValueChange={setThreshold}
            />
          </View>
        )}

        {/* Camera Controls */}
        {isStreaming && streamMode === 'audio+video' && videoServiceRef.current && (
          <View style={styles.cameraCard}>
            <Text style={styles.sectionTitle}>Camera Controls</Text>
            <TouchableOpacity style={styles.cameraButton} onPress={switchCamera}>
              <Camera size={20} color="#ffffff" />
              <Text style={styles.cameraButtonText}>
                Switch to {currentCamera === 'back' ? 'Front' : 'Back'} Camera
              </Text>
            </TouchableOpacity>
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
  qrCard: {
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
  qrContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  qrPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  qrNote: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  roomIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
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
  connectivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
  },
  connectivityButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  connectivityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  connectivityButtonTextActive: {
    color: '#ffffff',
  },
  sensitivityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sensitivityButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sensitivityButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  sensitivityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  sensitivityButtonTextActive: {
    color: '#ffffff',
  },
  streamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  streamButtonText: {
    fontSize: 18,
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
  thresholdText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  cameraCard: {
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
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});