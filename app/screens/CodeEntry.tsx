import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSession, ConnectionType, StreamMode } from '@/src/store/useSession';
import { getConnectionManager } from '@/src/transport/ConnectionManager';

interface CodeEntryProps {
  conn: ConnectionType;
  onBack: () => void;
  onConnected: () => void;
}

export default function CodeEntry({ conn, onBack, onConnected }: CodeEntryProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentSession, connectionStatus, isConnected } = useSession();
  const inputRefs = useRef<TextInput[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[0];
    }
    
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    
    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Check if code is complete
    if (newCode.every(digit => digit !== '') && index === 5) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (fullCode: string) => {
    if (isProcessing || fullCode.length !== 6) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // In a real app, you would validate this code against the server
      // For now, we'll simulate a successful connection
      
      // Attempt to join the session using the code
      const connectionManager = getConnectionManager({
        onConnected: () => {
          console.log('[CodeEntry] Successfully joined session');
          setIsProcessing(false);
          onConnected();
        },
        onDisconnected: () => {
          console.log('[CodeEntry] Disconnected from session');
          setIsProcessing(false);
        },
        onError: (error: string) => {
          console.error('[CodeEntry] Failed to join session:', error);
          setIsProcessing(false);
          setError(error);
        },
        onMessage: (message) => {
          console.log('[CodeEntry] Received message:', message);
        },
      });

      // For demo purposes, we'll create a mock session based on the code
      // In a real app, the code would be validated against an existing session
      const mockSession = {
        roomId: `room_${fullCode}`,
        joinKey: fullCode,
        mode: 'audio' as StreamMode,
        sensitivity: 'medium' as const,
        connectionType: conn,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        timestamp: Date.now(),
      };

      await connectionManager.joinSession(conn, mockSession);
      
    } catch (error) {
      console.error('[CodeEntry] Error joining session:', error);
      setIsProcessing(false);
      setError(error instanceof Error ? error.message : 'Failed to join session');
    }
  };

  const handleRetry = () => {
    setCode(['', '', '', '', '', '']);
    setError(null);
    inputRefs.current[0]?.focus();
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

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#4C6EF5" />
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
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.connectionInfo}>
            <View style={[styles.connectionIcon, { backgroundColor: getConnectionTypeColor() + '20' }]}>
              <Ionicons name={getConnectionTypeIcon()} size={24} color={getConnectionTypeColor()} />
            </View>
            <Text style={styles.connectionText}>{getConnectionTypeText()}</Text>
          </View>
          
          <Text style={styles.title}>Enter 6-Digit Code</Text>
          <Text style={styles.subtitle}>
            Enter the code shown on the other device
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
                error && styles.codeInputError
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>How to find the code:</Text>
          <View style={styles.helpStep}>
            <View style={styles.helpNumber}>
              <Text style={styles.helpNumberText}>1</Text>
            </View>
            <Text style={styles.helpStepText}>
              On the other device, go to the pairing screen
            </Text>
          </View>
          <View style={styles.helpStep}>
            <View style={styles.helpNumber}>
              <Text style={styles.helpNumberText}>2</Text>
            </View>
            <Text style={styles.helpStepText}>
              Look for the 6-digit code displayed on screen
            </Text>
          </View>
          <View style={styles.helpStep}>
            <View style={styles.helpNumber}>
              <Text style={styles.helpNumberText}>3</Text>
            </View>
            <Text style={styles.helpStepText}>
              Enter each digit in the boxes above
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh" size={16} color="#4C6EF5" />
          <Text style={styles.retryButtonText}>Clear & Try Again</Text>
        </TouchableOpacity>
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#0C1222',
    backgroundColor: 'white',
  },
  codeInputFilled: {
    borderColor: '#4C6EF5',
    backgroundColor: '#4C6EF5' + '10',
  },
  codeInputError: {
    borderColor: '#EF4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  helpContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1222',
    marginBottom: 16,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  helpNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4C6EF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  helpNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  helpStepText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  retryButtonText: {
    color: '#4C6EF5',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
    color: '#0C1222',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
});
