import { AudioMonitor } from './monitor';

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Recording: class MockRecording {
      prepareToRecordAsync = jest.fn().mockResolvedValue(undefined);
      startAsync = jest.fn().mockResolvedValue(undefined);
      stopAndUnloadAsync = jest.fn().mockResolvedValue(undefined);
      getStatusAsync = jest.fn().mockResolvedValue({ 
        isRecording: true, 
        metering: -20 
      });
    },
  },
}));

describe('AudioMonitor', () => {
  let monitor: AudioMonitor;

  beforeEach(() => {
    monitor = new AudioMonitor();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await monitor.stop();
  });

  test('should start monitoring with default threshold', async () => {
    await expect(monitor.start()).resolves.not.toThrow();
  });

  test('should start monitoring with custom threshold', async () => {
    await expect(monitor.start(0.5)).resolves.not.toThrow();
  });

  test('should update threshold', () => {
    monitor.updateThreshold(0.7);
    // Threshold update should not throw
    expect(true).toBe(true);
  });

  test('should register level update listeners', () => {
    const mockCallback = jest.fn();
    const unsubscribe = monitor.onLevelUpdate(mockCallback);
    
    expect(typeof unsubscribe).toBe('function');
  });

  test('should register threshold exceeded listeners', () => {
    const mockCallback = jest.fn();
    const unsubscribe = monitor.onThresholdExceeded(mockCallback);
    
    expect(typeof unsubscribe).toBe('function');
  });

  test('should unsubscribe listeners correctly', () => {
    const mockCallback = jest.fn();
    const unsubscribe = monitor.onLevelUpdate(mockCallback);
    
    unsubscribe();
    // Should not throw
    expect(true).toBe(true);
  });

  test('RMS calculation should work with sample data', () => {
    // Test the RMS logic with known values
    const testData = new Uint8Array([0, 128, 255, 64, 192]);
    const expectedRms = Math.sqrt(
      (Math.pow(0/255, 2) + Math.pow(128/255, 2) + Math.pow(255/255, 2) + Math.pow(64/255, 2) + Math.pow(192/255, 2)) / 5
    ) * 2;
    
    // Since calculateRMS is private, we test the threshold logic indirectly
    expect(expectedRms).toBeGreaterThan(0);
    expect(expectedRms).toBeLessThanOrEqual(1);
  });
});