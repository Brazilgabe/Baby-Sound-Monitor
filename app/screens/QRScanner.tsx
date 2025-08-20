import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession, ConnectionType, StreamMode } from '@/src/store/useSession';
import { getConnectionManager } from '@/src/transport/ConnectionManager';
import { QRCodeScanner } from '@/src/components/QRCodeScanner';
import { QRCodeData } from '@/src/utils/QRCodeUtils';
import { LocalSignaling } from '@/src/webrtc/localSignaling';
import { WebRTCSession } from '@/src/webrtc/WebRTCSession';

interface QRScannerProps {
  conn: ConnectionType;
  onBack: () => void;
  onUseCode: () => void;
  onConnected: () => void;
}

export default function QRScanner({ conn, onBack, onUseCode, onConnected }: QRScannerProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answerQR, setAnswerQR] = useState<string>('');
  const [localSignaling, setLocalSignaling] = useState<LocalSignaling | null>(null);
  const { currentSession, connectionStatus, isConnected } = useSession();

  const handleQRCodeScanned = async (qrData: QRCodeData) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      if (Platform.OS === 'android' && conn === 'bt') {
        // Android QR round-trip: handle offer and generate answer
        const session = new WebRTCSession();
        const signaling = new LocalSignaling(session);
        setLocalSignaling(signaling);
        
        // Try to parse as base64 offer first
        try {
          const result = await signaling.joinAsParent(qrData.roomId); // roomId contains the base64 offer
          setAnswerQR(result.answerQR);
          setIsProcessing(false);
          return;
        } catch (error) {
          // If not base64, fall back to regular session data
        }
      }
      
      // Regular session data handling
      const sessionData = {
        roomId: qrData.roomId,
        joinKey: qrData.joinKey,
        mode: qrData.mode,
        sensitivity: qrData.sensitivity,
        connectionType: qrData.connectionType,
        createdAt: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
        timestamp: Date.now(),
      };

      // Attempt to join the session
      const connectionManager = getConnectionManager({
        onConnected: () => {
          console.log('[QRScanner] Successfully joined session');
          setIsProcessing(false);
          onConnected();
        },
        onDisconnected: () => {
          console.log('[QRScanner] Disconnected from session');
          setIsProcessing(false);
        },
        onError: (error: string) => {
          console.error('[QRScanner] Failed to join session:', error);
          setIsProcessing(false);
          Alert.alert('Connection Failed', `Failed to join session: ${error}`);
        },
        onMessage: (message) => {
          console.log('[QRScanner] Received message:', message);
        },
      });

      // Join the existing session
      await connectionManager.joinSession(conn, sessionData);

    } catch (error) {
      console.error('[QRScanner] Error processing QR code:', error);
      setIsProcessing(false);
      Alert.alert(
        'Connection Failed',
        error instanceof Error ? error.message : 'Failed to join session. Please try again.',
        [
          { text: 'Try Again', onPress: () => setShowScanner(false) },
          { text: 'Use Code Instead', onPress: onUseCode }
        ]
      );
    }
  };

  const handleManualCode = () => {
    onUseCode();
  };

  if (showScanner) {
    return (
      <QRCodeScanner
        onScan={handleQRCodeScanned}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.processingContainer}>
          <Ionicons name="sync" size={64} color="#4C6EF5" />
          <Text style={styles.processingTitle}>Joining Session...</Text>
          <Text style={styles.processingText}>
            Please wait while we connect to the other device
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Scan QR Code</Text>
          <Text style={styles.subtitle}>
            Point your camera at the QR code on the other device
          </Text>
        </View>
        
        <TouchableOpacity onPress={handleManualCode} style={styles.codeButton}>
          <Ionicons name="keypad" size={20} color="white" />
          <Text style={styles.codeButtonText}>Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <View style={styles.scannerPlaceholder}>
          <View style={styles.scanFrame}>
            <View style={styles.corner} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          
          <Text style={styles.scanText}>
            Position the QR code within the frame
          </Text>
          
          <TouchableOpacity style={styles.scanButton} onPress={() => setShowScanner(true)}>
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.scanButtonText}>Start Camera Scanner</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Android Answer QR Display */}
      {Platform.OS === 'android' && conn === 'bt' && answerQR && (
        <View style={styles.answerQRContainer}>
          <Text style={styles.answerQRTitle}>Answer QR Code</Text>
          <Text style={styles.answerQRInstructions}>
            Nursery device should scan this QR code to complete connection
          </Text>
          <View style={styles.answerQRCode}>
            <Text style={styles.answerQRText}>{answerQR.substring(0, 50)}...</Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Make sure both devices are connected to the same network
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  codeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  cameraContainer: {
    flex: 1,
    margin: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scannerPlaceholder: {
    flex: 1,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4C6EF5',
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    top: 'auto',
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 32,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4C6EF5',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  processingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  answerQRContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  answerQRTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  answerQRInstructions: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  answerQRCode: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  answerQRText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'monospace',
  },
});
