import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { useSession, Sensitivity } from '@/src/store/useSession';
import { TransportMessage } from '@/src/transport/RealtimeTransport';

export interface AudioLevelData {
  level: number;
  timestamp: number;
  isNoiseDetected: boolean;
}

export interface StreamingCallbacks {
  onAudioLevel: (data: AudioLevelData) => void;
  onNoiseDetected: (level: number) => void;
  onError: (error: string) => void;
}

export class StreamingService {
  private recording: Audio.Recording | null = null;
  private isStreaming = false;
  private audioLevelInterval: NodeJS.Timeout | null = null;
  private noiseDetectionInterval: NodeJS.Timeout | null = null;
  private lastNoiseAlert = 0;
  private noiseAlertCooldown = 30000; // 30 seconds
  private sensitivityThresholds = {
    low: 0.3,
    medium: 0.5,
    high: 0.7
  };

  constructor(
    private callbacks: StreamingCallbacks,
    private sensitivity: Sensitivity = 'medium'
  ) {}

  async startStreaming(): Promise<void> {
    if (this.isStreaming) return;

    try {
      // Request microphone permission
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission denied');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Start recording
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.m4a',
          outputFormat: 2, // AndroidOutputFormat.MPEG_4
          audioEncoder: 3, // AndroidAudioEncoder.AAC
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: '.m4a',
          outputFormat: 'aac ', // IOSOutputFormat.MPEG4AAC
          audioQuality: 127, // IOSAudioQuality.MAX
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      await this.recording.startAsync();
      this.isStreaming = true;

      // Start audio level monitoring
      this.startAudioLevelMonitoring();
      
      // Start noise detection
      this.startNoiseDetection();

      console.log('[StreamingService] Started streaming');

    } catch (error) {
      console.error('[StreamingService] Failed to start streaming:', error);
      this.callbacks.onError(`Failed to start streaming: ${error}`);
      throw error;
    }
  }

  async stopStreaming(): Promise<void> {
    if (!this.isStreaming) return;

    try {
      this.isStreaming = false;

      // Stop intervals
      if (this.audioLevelInterval) {
        clearInterval(this.audioLevelInterval);
        this.audioLevelInterval = null;
      }

      if (this.noiseDetectionInterval) {
        clearInterval(this.noiseDetectionInterval);
        this.noiseDetectionInterval = null;
      }

      // Stop recording
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }

      console.log('[StreamingService] Stopped streaming');

    } catch (error) {
      console.error('[StreamingService] Error stopping streaming:', error);
    }
  }

  updateSensitivity(sensitivity: Sensitivity): void {
    this.sensitivity = sensitivity;
  }

  private startAudioLevelMonitoring(): void {
    this.audioLevelInterval = setInterval(async () => {
      if (!this.recording || !this.isStreaming) return;

      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          // Get audio level (this is a simplified approach)
          // In a real app, you'd analyze the actual audio buffer
          const level = this.getAudioLevel();
          const timestamp = Date.now();
          
          this.callbacks.onAudioLevel({
            level,
            timestamp,
            isNoiseDetected: false
          });
        }
      } catch (error) {
        console.error('[StreamingService] Error getting audio level:', error);
      }
    }, 100); // Update every 100ms
  }

  private startNoiseDetection(): void {
    this.noiseDetectionInterval = setInterval(async () => {
      if (!this.isStreaming) return;

      try {
        const level = this.getAudioLevel();
        const threshold = this.sensitivityThresholds[this.sensitivity];
        
        if (level > threshold) {
          const now = Date.now();
          if (now - this.lastNoiseAlert > this.noiseAlertCooldown) {
            this.lastNoiseAlert = now;
            this.callbacks.onNoiseDetected(level);
            
            // Update audio level data to show noise detected
            this.callbacks.onAudioLevel({
              level,
              timestamp: now,
              isNoiseDetected: true
            });
          }
        }
      } catch (error) {
        console.error('[StreamingService] Error in noise detection:', error);
      }
    }, 500); // Check every 500ms
  }

  private getAudioLevel(): number {
    // This is a simplified audio level calculation
    // In a real app, you'd analyze the actual audio buffer from the recording
    // For now, we'll simulate varying levels
    const baseLevel = Math.random() * 0.3; // Base ambient noise
    const variation = Math.random() * 0.4; // Random variation
    return Math.min(1.0, Math.max(0.0, baseLevel + variation));
  }

  isActive(): boolean {
    return this.isStreaming;
  }

  getStatus(): { isStreaming: boolean; sensitivity: Sensitivity } {
    return {
      isStreaming: this.isStreaming,
      sensitivity: this.sensitivity
    };
  }
}

// Video streaming service for camera feed
export class VideoStreamingService {
  private isStreaming = false;
  private cameraStream: MediaStream | null = null;

  async startVideoStream(): Promise<MediaStream> {
    if (this.isStreaming) {
      throw new Error('Video streaming already active');
    }

    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      this.cameraStream = stream;
      this.isStreaming = true;

      console.log('[VideoStreamingService] Started video streaming');
      return stream;

    } catch (error) {
      console.error('[VideoStreamingService] Failed to start video streaming:', error);
      throw error;
    }
  }

  stopVideoStream(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    this.isStreaming = false;
    console.log('[VideoStreamingService] Stopped video streaming');
  }

  switchCamera(): Promise<MediaStream> {
    if (!this.isStreaming) {
      throw new Error('Video streaming not active');
    }

    // Stop current stream
    this.stopVideoStream();
    
    // Start new stream with opposite facing mode
    const newFacingMode = this.cameraStream?.getVideoTracks()[0]?.getSettings().facingMode === 'user' ? 'environment' : 'user';
    
    return navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: newFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: false
    });
  }

  isActive(): boolean {
    return this.isStreaming;
  }
}
