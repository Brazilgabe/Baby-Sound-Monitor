import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import ConnectionSelect from './screens/ConnectionSelect';
import RoleSelect from './screens/RoleSelect';
import PairingSelect from './screens/PairingSelect';
import QRScanner from './screens/QRScanner';
import CodeEntry from './screens/CodeEntry';
import ParentMonitor from './screens/ParentMonitor';
import NurseryListener from './screens/NurseryListener';
import { useSession, ConnectionType, StreamMode } from '@/src/store/useSession';
import { getConnectionManager, clearConnectionManager } from '@/src/transport/ConnectionManager';

type AppStep = "connect" | "role" | "pair" | "qr" | "code" | "parent" | "baby";

export default function BabyMonitorApp() {
  const [step, setStep] = useState<AppStep>("connect");
  const [conn, setConn] = useState<ConnectionType | null>(null);
  const [role, setRole] = useState<"parent" | "baby" | null>(null);
  const [mode, setMode] = useState<StreamMode>("audio");
  
  const { 
    connectionType, 
    setConnectionType, 
    setConnectionStatus,
    setIsConnected,
    generateNewSession,
    currentSession,
    setCurrentSession
  } = useSession();

  // Initialize connection manager
  useEffect(() => {
    const connectionManager = getConnectionManager({
      onConnected: () => {
        console.log('[BabyMonitorApp] Connected successfully');
        setIsConnected(true);
        setConnectionStatus('connected');
      },
      onDisconnected: () => {
        console.log('[BabyMonitorApp] Disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
      },
      onError: (error: string) => {
        console.error('[BabyMonitorApp] Connection error:', error);
        setConnectionStatus('failed');
        // In a real app, you'd show an error message to the user
      },
      onMessage: (message) => {
        console.log('[BabyMonitorApp] Received message:', message);
        // Handle incoming messages based on role and message type
      },
    });

    // Cleanup on unmount
    return () => {
      clearConnectionManager();
    };
  }, []);

  // Web compatibility check
  if (Platform.OS === 'web') {
    // For web, we'll show a simplified version or redirect to mobile
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#F7F8FB',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1 style={{ color: '#0C1222', marginBottom: '20px' }}>Baby Sound Monitor</h1>
        <p style={{ color: '#64748B', maxWidth: '400px', lineHeight: '1.6' }}>
          This app is designed for mobile devices. Please use the Expo Go app on your phone 
          or run it in a mobile simulator for the full experience.
        </p>
        <div style={{ 
          marginTop: '30px', 
          padding: '15px 30px', 
          backgroundColor: '#4C6EF5', 
          color: 'white', 
          borderRadius: '12px',
          cursor: 'pointer'
        }}>
          Open in Mobile Simulator
        </div>
      </div>
    );
  }

  const handleConnectionSelect = async (choice: ConnectionType) => {
    try {
      setConn(choice);
      setConnectionType(choice);
      
      // Generate a new session for the selected connection type
      const session = generateNewSession();
      setCurrentSession(session);
      
      // Attempt to establish connection
      const connectionManager = getConnectionManager({
        onConnected: () => {
          console.log('[BabyMonitorApp] Connected successfully');
          setIsConnected(true);
          setConnectionStatus('connected');
          setStep("role");
        },
        onDisconnected: () => {
          console.log('[BabyMonitorApp] Disconnected');
          setIsConnected(false);
          setConnectionStatus('disconnected');
        },
        onError: (error: string) => {
          console.error('[BabyMonitorApp] Connection error:', error);
          setConnectionStatus('failed');
          // Show error and allow retry
          alert(`Connection failed: ${error}. Please try again.`);
        },
        onMessage: (message) => {
          console.log('[BabyMonitorApp] Received message:', message);
        },
      });

      await connectionManager.connect(choice, session);
      
    } catch (error) {
      console.error('[BabyMonitorApp] Failed to establish connection:', error);
      setConnectionStatus('failed');
      alert(`Failed to establish connection: ${error}. Please try again.`);
    }
  };

  const handleRoleSelect = (selectedRole: "parent" | "baby") => {
    setRole(selectedRole);
    setStep("pair");
  };

  const handlePairingSelect = (method: "qr" | "code") => {
    setStep(method);
  };

  const handleConnected = () => {
    setStep(role === "parent" ? "parent" : "baby");
  };

  const handleBackToRole = () => {
    setStep("role");
  };

  const handleBackToConnection = async () => {
    // Disconnect current connection
    try {
      const connectionManager = getConnectionManager({
        onConnected: () => {},
        onDisconnected: () => {},
        onError: () => {},
        onMessage: () => {},
      });
      await connectionManager.disconnect();
    } catch (error) {
      console.error('[BabyMonitorApp] Error disconnecting:', error);
    }
    
    setStep("connect");
    setConn(null);
    setRole(null);
    setConnectionStatus('disconnected');
    setIsConnected(false);
  };

  const handleBackToPairing = () => {
    setStep("pair");
  };

  const handleUseCode = () => {
    setStep("code");
  };

  return (
    <>
      {step === "connect" && (
        <ConnectionSelect onNext={handleConnectionSelect} />
      )}
      
      {step === "role" && (
        <RoleSelect onBack={handleBackToConnection} onNext={handleRoleSelect} />
      )}
      
      {step === "pair" && conn && (
        <PairingSelect
          conn={conn}
          mode={mode}
          onModeChange={setMode}
          onBack={handleBackToConnection}
          onNext={handlePairingSelect}
        />
      )}
      
      {step === "qr" && conn && (
        <QRScanner
          conn={conn}
          onBack={handleBackToPairing}
          onUseCode={handleUseCode}
          onConnected={handleConnected}
        />
      )}
      
      {step === "code" && conn && (
        <CodeEntry
          conn={conn}
          onBack={handleBackToPairing}
          onConnected={handleConnected}
        />
      )}
      
      {step === "parent" && conn && (
        <ParentMonitor
          onBack={handleBackToRole}
          conn={conn}
          mode={mode}
        />
      )}
      
      {step === "baby" && conn && (
        <NurseryListener
          onBackToRole={handleBackToRole}
          conn={conn}
          mode={mode}
        />
      )}
    </>
  );
}
