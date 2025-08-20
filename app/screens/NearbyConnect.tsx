import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/src/store/useSession";
import nearby from "@/src/signaling/nearby";
import { WebRTCSession } from "@/src/webrtc/WebRTCSession";

export default function NearbyConnect() {
  const { role, streamMode } = useSession(); // role: 'listener' | 'parent', streamMode: 'audio' | 'video'
  const [status, setStatus] = useState("Starting…");
  const [session, setSession] = useState<WebRTCSession | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const newSession = new WebRTCSession();
        setSession(newSession);
        
        // Initialize local media before creating offers/answers
        await newSession.initLocalMedia(streamMode === 'audio' ? 'audio' : 'video');
        
        if (role === "listener") {
          setStatus("Advertising… waiting for parent");
          await nearby.host(newSession, streamMode === "audio" ? "audio" : "video");
          setStatus("Connected");
        } else {
          setStatus("Searching for listener…");
          await nearby.join(newSession);
          setStatus("Connected");
        }
      } catch (e) {
        Alert.alert("Nearby failed", String(e));
      }
    })();

    return () => { 
      nearby.stop(); 
      if (session) {
        session.close(); 
      }
    };
  }, [role, streamMode]);

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>Nearby pairing</Text>
      <Text style={styles.sub}>{status}</Text>
      <Text style={styles.hint}>Keep both phones unlocked and close together.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  sub: { color: "#64748B", marginBottom: 16 },
  hint: { color: "#94A3B8" },
});
