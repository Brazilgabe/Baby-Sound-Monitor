import React, { useState } from 'react';
import { Platform } from 'react-native';
import ConnectionSelect from './screens/ConnectionSelect';
import RoleSelect from './screens/RoleSelect';
import PairingSelect from './screens/PairingSelect';
import QRScanner from './screens/QRScanner';
import CodeEntry from './screens/CodeEntry';
import ParentMonitor from './screens/ParentMonitor';
import NurseryListener from './screens/NurseryListener';

type AppStep = "connect" | "role" | "pair" | "qr" | "code" | "parent" | "baby";

export default function BabyMonitorApp() {
  const [step, setStep] = useState<AppStep>("connect");
  const [conn, setConn] = useState<"wifi" | "bt" | null>(null);
  const [role, setRole] = useState<"parent" | "baby" | null>(null);
  const [mode, setMode] = useState<"audio" | "video">("audio");

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

  const handleConnectionSelect = (choice: "wifi" | "bt") => {
    setConn(choice);
    setStep("role");
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

  const handleBackToConnection = () => {
    setStep("connect");
    setConn(null);
    setRole(null);
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
      
      {step === "parent" && (
        <ParentMonitor
          onBack={handleBackToRole}
          conn={conn}
          mode={mode}
        />
      )}
      
      {step === "baby" && (
        <NurseryListener
          onBackToRole={handleBackToRole}
          conn={conn}
          mode={mode}
        />
      )}
    </>
  );
}
