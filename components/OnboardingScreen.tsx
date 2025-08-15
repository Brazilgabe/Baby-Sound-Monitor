import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Baby, Headphones, Shield, Bell, Camera, Mic } from 'lucide-react-native';
import { useSession } from '@/src/store/useSession';
import { permissionManager } from '@/src/utils/PermissionManager';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to Baby Sound Monitor',
    subtitle: 'Monitor your baby from anywhere',
    description: 'A secure, real-time baby monitoring solution that works both nearby and over the internet.',
    icon: <Baby size={80} color="#3b82f6" />,
    color: '#3b82f6',
  },
  {
    id: 2,
    title: 'Two Simple Roles',
    subtitle: 'Listener & Parent',
    description: 'Listener: Place in nursery to monitor sounds\nParent: Receive alerts and live audio/video',
    icon: <Headphones size={80} color="#10b981" />,
    color: '#10b981',
  },
  {
    id: 3,
    title: 'Secure & Private',
    subtitle: 'Your data stays yours',
    description: 'All sessions are ephemeral and encrypted. No recordings are stored, and each session uses unique codes.',
    icon: <Shield size={80} color="#8b5cf6" />,
    color: '#8b5cf6',
  },
  {
    id: 4,
    title: 'Smart Notifications',
    subtitle: 'Never miss important sounds',
    description: 'Get instant alerts when baby sounds are detected, with customizable sensitivity levels.',
    icon: <Bell size={80} color="#f59e0b" />,
    color: '#f59e0b',
  },
  {
    id: 5,
    title: 'Required Permissions',
    subtitle: 'We need these to work',
    description: 'Microphone: Monitor baby sounds\nCamera: QR scanning & video streaming\nNotifications: Alert you of events',
    icon: <Camera size={80} color="#ef4444" />,
    color: '#ef4444',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { setRole } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const status = await permissionManager.checkPermissions();
      const hasPermissions = status.microphone && status.camera && status.notifications;
      setPermissionsGranted(hasPermissions);
    } catch (error) {
      console.error('Failed to check permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const status = await permissionManager.requestAllPermissions();
      const hasPermissions = status.microphone && status.camera && status.notifications;
      setPermissionsGranted(hasPermissions);
      
      if (hasPermissions) {
        // Move to next step or complete onboarding
        if (currentStep < onboardingSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        }
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    console.log('[OnboardingScreen] Get Started button pressed');
    console.log('[OnboardingScreen] Calling onComplete prop');
    onComplete();
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1; // This will be true when currentStep === 4
  const isPermissionStep = currentStep === 4; // Step 5 (index 4) is the permission step

  console.log('[OnboardingScreen] Debug:', {
    currentStep,
    totalSteps: onboardingSteps.length,
    isLastStep,
    isPermissionStep,
    permissionsGranted
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {onboardingSteps.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.progressDot,
                index <= currentStep ? styles.progressDotActive : styles.progressDotInactive,
                { backgroundColor: index <= currentStep ? step.color : '#e5e7eb' },
              ]}
            />
          ))}
        </View>

        {/* Step content */}
        <View style={styles.stepContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${currentStepData.color}20` }]}>
            {currentStepData.icon}
          </View>

          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>

          {/* Permission status for step 5 */}
          {isPermissionStep && (
            <View style={styles.permissionStatus}>
              <View style={styles.permissionItem}>
                <Mic size={20} color={permissionsGranted ? '#10b981' : '#6b7280'} />
                <Text style={[styles.permissionText, { color: permissionsGranted ? '#10b981' : '#6b7280' }]}>
                  Microphone {permissionsGranted ? '✓' : '✗'}
                </Text>
              </View>
              <View style={styles.permissionItem}>
                <Camera size={20} color={permissionsGranted ? '#10b981' : '#6b7280'} />
                <Text style={[styles.permissionText, { color: permissionsGranted ? '#10b981' : '#6b7280' }]}>
                  Camera {permissionsGranted ? '✓' : '✗'}
                </Text>
              </View>
              <View style={styles.permissionItem}>
                <Bell size={20} color={permissionsGranted ? '#10b981' : '#6b7280'} />
                <Text style={[styles.permissionText, { color: permissionsGranted ? '#10b981' : '#6b7280' }]}>
                  Notifications {permissionsGranted ? '✓' : '✗'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={previousStep}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {isPermissionStep && !permissionsGranted ? (
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: currentStepData.color }]} onPress={requestPermissions}>
              <Text style={styles.primaryButtonText}>Grant Permissions</Text>
            </TouchableOpacity>
          ) : isLastStep ? (
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: currentStepData.color }]} onPress={completeOnboarding}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: currentStepData.color }]} onPress={nextStep}>
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotActive: {
    transform: [{ scale: 1.2 }],
  },
  progressDotInactive: {
    opacity: 0.5,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'center',
    maxWidth: width - 80,
  },
  permissionStatus: {
    marginTop: 32,
    gap: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    minWidth: 100,
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 18,
    fontWeight: '600',
  },
});
