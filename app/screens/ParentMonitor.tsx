import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Square, Bell, Home, Activity, Settings } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/src/theme';
import { Header } from '@/components/ui/Header';
import { ConnectionPill } from '@/components/ui/ConnectionPill';
import { ModeBadge } from '@/components/ui/ModeBadge';
import { WaveformPreview } from '@/components/ui/WaveformPreview';
import { LabeledSlider } from '@/components/ui/LabeledSlider';

interface ParentMonitorProps {
  onBack?: () => void;
  conn: "wifi" | "bt" | null;
  mode: "audio" | "video";
}

export default function ParentMonitor({ onBack, conn, mode }: ParentMonitorProps) {
  const [isListening, setIsListening] = useState(false);
  const [preset, setPreset] = useState("Normal home");
  const [threshold, setThreshold] = useState(45);
  
  const tabs = [
    { key: "monitor", label: "Monitor", icon: Home },
    { key: "timeline", label: "Timeline", icon: Activity },
    { key: "settings", label: "Settings", icon: Settings },
  ];
  const [tab, setTab] = useState<typeof tabs[number]["key"]>("monitor");

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={onBack} onSettings={() => setTab("settings")} />

      <View style={styles.connectionInfo}>
        <ConnectionPill conn={conn} />
        <ModeBadge mode={mode} />
      </View>

      <View style={styles.content}>
        {tab === "monitor" && (
          <View style={styles.monitorTab}>
            <View style={styles.monitorCard}>
              <View style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <View style={[styles.statusDot, isListening && styles.statusDotActive]} />
                  <Text style={styles.statusText}>
                    {isListening ? "Listening" : "Paused"}
                  </Text>
                </View>
                <Text style={styles.presetText}>Preset: {preset}</Text>
              </View>
              
              <View style={styles.waveformContainer}>
                <WaveformPreview level={isListening ? 0.6 : 0.3} />
              </View>
              
              <View style={styles.controlsRow}>
                <View style={styles.presetButtons}>
                  {["Quiet apartment", "Normal home", "Noisy environment"].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.presetButton, preset === p && styles.presetButtonSelected]}
                      onPress={() => setPreset(p)}
                    >
                      <Text style={[styles.presetButtonText, preset === p && styles.presetButtonTextSelected]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: theme.color.primary }]}
                  onPress={() => setIsListening(!isListening)}
                >
                  {isListening ? <Square size={16} color="#FFFFFF" /> : <Play size={16} color="#FFFFFF" />}
                  <Text style={styles.playButtonText}>
                    {isListening ? "Stop" : "Start"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <LabeledSlider label="Noise threshold" value={threshold} onChange={setThreshold} />
              
              <View style={styles.bedtimeInfo}>
                <Bell size={16} color={theme.color.slate[600]} />
                <Text style={styles.bedtimeText}>Bedtime Focus reduces minor noise alerts</Text>
              </View>
            </View>
            
            <Text style={styles.quietMessage}>All quiet. We will let you know if anything changes.</Text>
          </View>
        )}
        
        {tab === "timeline" && (
          <View style={styles.timelineTab}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.timelineItem}>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Cry detected</Text>
                  <Text style={styles.timelineSubtitle}>Duration 18s · 2:11 am</Text>
                </View>
                <TouchableOpacity style={styles.timelineButton}>
                  <Text style={styles.timelineButtonText}>Details</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        
        {tab === "settings" && (
          <View style={styles.settingsTab}>
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtitle}>Get alerts when crying is detected</Text>
              </View>
              <View style={styles.toggle}>
                <View style={styles.toggleThumb} />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.navContent}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              style={styles.navButton}
              onPress={() => setTab(key)}
            >
              <View style={[styles.navIcon, tab === key && styles.navIconActive]}>
                <Icon size={18} color={tab === key ? theme.color.primary : theme.color.slate[500]} />
              </View>
              <Text style={[styles.navLabel, tab === key && styles.navLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.color.bgDay,
  },
  connectionInfo: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 112, // Space for bottom nav
  },
  monitorTab: {
    marginTop: theme.spacing.sm,
  },
  monitorCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.color.slate[200],
    backgroundColor: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: theme.color.slate[400],
  },
  statusDotActive: {
    backgroundColor: theme.color.emerald[500],
  },
  statusText: {
    fontSize: theme.typography.sm.fontSize,
    opacity: 0.8,
  },
  presetText: {
    fontSize: 12,
    opacity: 0.7,
  },
  waveformContainer: {
    marginTop: theme.spacing.md,
  },
  controlsRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  presetButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.color.slate[200],
    backgroundColor: '#FFFFFF',
  },
  presetButtonSelected: {
    backgroundColor: theme.color.primary,
    borderColor: 'transparent',
  },
  presetButtonText: {
    fontSize: theme.typography.sm.fontSize,
    color: theme.color.slate[700],
  },
  presetButtonTextSelected: {
    color: '#FFFFFF',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sm.fontSize,
    fontWeight: '500',
  },
  bedtimeInfo: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  bedtimeText: {
    fontSize: theme.typography.sm.fontSize,
    opacity: 0.8,
  },
  quietMessage: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sm.fontSize,
    opacity: 0.8,
  },
  timelineTab: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  timelineItem: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.color.slate[200],
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: theme.typography.sm.fontSize,
    fontWeight: '500',
  },
  timelineSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  timelineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineButtonText: {
    fontSize: theme.typography.sm.fontSize,
    color: theme.color.slate[700],
  },
  settingsTab: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  settingItem: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.color.slate[200],
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.sm.fontSize,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.color.primary,
    padding: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 20 }],
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  navContent: {
    marginHorizontal: 'auto',
    maxWidth: 400,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
  },
  navIcon: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  navIconActive: {
    backgroundColor: `${theme.color.primary}1A`, // 10% opacity
  },
  navLabel: {
    fontSize: 12,
    marginTop: theme.spacing.xs,
    color: theme.color.slate[500],
  },
  navLabelActive: {
    color: theme.color.primary,
  },
});
