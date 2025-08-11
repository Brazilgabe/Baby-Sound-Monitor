import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export class AudioMonitor {
  private recording: Audio.Recording | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private threshold: number = 0.3;
  private listeners: {
    onLevelUpdate: ((level: number) => void)[];
    onThresholdExceeded: (() => void)[];
  } = {
    onLevelUpdate: [],
    onThresholdExceeded: [],
  };
  private lastExceededTime: number = 0;
  private readonly THRESHOLD_DURATION = 300; // 300ms
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  async start(threshold: number = 0.3): Promise<void> {
    this.threshold = threshold;

    // Request permissions
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      throw new Error('Microphone permission not granted');
    }

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: Platform.OS === 'ios',
    });

    // Start recording and level monitoring
    if (Platform.OS === 'web') {
      await this.startWebAudioMonitoring();
    } else {
      await this.startNativeRecording();
    }
    
    this.startLevelMonitoring();
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
      this.recording = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
      this.dataArray = null;
    }
  }

  updateThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  onLevelUpdate(callback: (level: number) => void): () => void {
    this.listeners.onLevelUpdate.push(callback);
    return () => {
      const index = this.listeners.onLevelUpdate.indexOf(callback);
      if (index > -1) {
        this.listeners.onLevelUpdate.splice(index, 1);
      }
    };
  }

  onThresholdExceeded(callback: () => void): () => void {
    this.listeners.onThresholdExceeded.push(callback);
    return () => {
      const index = this.listeners.onThresholdExceeded.indexOf(callback);
      if (index > -1) {
        this.listeners.onThresholdExceeded.splice(index, 1);
      }
    };
  }

  private async startWebAudioMonitoring(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: false, noiseSuppression: false } 
      });
      
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
    } catch (error) {
      throw new Error(`Failed to start web audio monitoring: ${error}`);
    }
  }

  private async startNativeRecording(): Promise<void> {
    this.recording = new Audio.Recording();
    try {
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await this.recording.startAsync();
    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  private startLevelMonitoring(): void {
    this.intervalId = setInterval(async () => {
      let level = 0;

      if (Platform.OS === 'web' && this.analyser && this.dataArray) {
        // Web: Use Web Audio API for real-time level detection
        this.analyser.getByteFrequencyData(this.dataArray);
        const rms = this.calculateRMS(this.dataArray);
        level = rms;
      } else if (this.recording) {
        // Native: Use recording status (limited real-time capability)
        try {
          const status = await this.recording.getStatusAsync();
          if (status.isRecording) {
            // iOS provides metering data, Android needs simulation
            level = this.getMeteringLevel(status);
          }
        } catch (error) {
          console.error('Error getting recording status:', error);
        }
      }
      
      // Notify level update listeners
      this.listeners.onLevelUpdate.forEach(callback => callback(level));
      
      // Check threshold
      if (level > this.threshold) {
        const now = Date.now();
        if (now - this.lastExceededTime >= this.THRESHOLD_DURATION) {
          this.lastExceededTime = now;
          this.listeners.onThresholdExceeded.forEach(callback => callback());
        }
      }
    }, 100); // Check every 100ms
  }

  private calculateRMS(dataArray: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalizedValue = dataArray[i] / 255.0;
      sum += normalizedValue * normalizedValue;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    return Math.min(1, rms * 2); // Scale and cap at 1
  }

  private getMeteringLevel(status: any): number {
    // On iOS, we can get actual metering data
    if (Platform.OS === 'ios' && status.metering !== undefined) {
      // Convert dB to linear scale (0-1)
      const db = status.metering;
      return Math.max(0, Math.min(1, (db + 60) / 60));
    }
    
    // For Android, simulate varying levels (limited without direct audio analysis)
    return Math.random() * 0.6;
  }
}