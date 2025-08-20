import { Platform } from "react-native";
import { Multipeer, MCNearbyServiceBrowser, MCNearbyServiceAdvertiser } from "react-native-multipeer";
import { WebRTCSession } from "@/src/webrtc/WebRTCSession";

// One service type (<=15 chars, letters/numbers)
const SERVICE_TYPE = "baby-monitor";

// Simple JSON protocol
type Msg =
  | { t: "offer"; sdp: string; mode: "audio" | "video" }
  | { t: "answer"; sdp: string };

export class NearbySignaling {
  private advertiser?: MCNearbyServiceAdvertiser;
  private browser?: MCNearbyServiceBrowser;
  private peerId?: string;
  private connectedPeer?: string;

  async init() {
    if (Platform.OS !== "ios") return; // iOS-only for now
    this.peerId = await Multipeer.getCurrentPeerID(); // stable per install
  }

  // Nursery role: start advertising, generate offer via WebRTCSession, send to parent, receive answer
  async host(session: WebRTCSession, mode: "audio" | "video") {
    if (Platform.OS !== "ios") throw new Error("Nearby host is iOS-only currently");

    await this.init();
    const adv = new MCNearbyServiceAdvertiser(this.peerId!, SERVICE_TYPE, { deviceName: "Nursery" });
    this.advertiser = adv;

    await Multipeer.startAdvertisingPeer(adv);

    // When parent invites/accepts, we'll get connection events
    Multipeer.on("peerConnected", async ({ peer }: { peer: string }) => {
      this.connectedPeer = peer;
      // Create offer and send to parent
      const { offer } = await session.createOffer(mode);
      const msg: Msg = { t: "offer", sdp: offer.sdp!, mode };
      await Multipeer.sendToPeer(JSON.stringify(msg), peer);
    });

    Multipeer.on("receivedStringData", async ({ peer, data }) => {
      try {
        const parsed: Msg = JSON.parse(data);
        if (parsed.t === "answer") {
          await session.acceptAnswer({ type: "answer", sdp: parsed.sdp });
        }
      } catch {}
    });

    // Allow invites
    Multipeer.on("foundPeer", async ({ peer }: { peer: string }) => {
      // Parent will invite us; no action needed here for host
    });

    Multipeer.on("inviteReceived", async ({ peer, context }) => {
      // Parent invited us — accept immediately
      await Multipeer.acceptInvite(peer);
    });
  }

  // Parent role: browse, connect to Nursery, receive offer, create/send answer
  async join(session: WebRTCSession) {
    if (Platform.OS !== "ios") throw new Error("Nearby join is iOS-only currently");

    await this.init();
    const browser = new MCNearbyServiceBrowser(this.peerId!, SERVICE_TYPE);
    this.browser = browser;

    await Multipeer.startBrowsingForPeers(browser);

    Multipeer.on("foundPeer", async ({ peer }: { peer: string }) => {
      // Invite Nursery immediately
      await Multipeer.invitePeer(peer, this.peerId!, SERVICE_TYPE, null, 15);
    });

    Multipeer.on("peerConnected", async ({ peer }: { peer: string }) => {
      this.connectedPeer = peer;
    });

    Multipeer.on("receivedStringData", async ({ peer, data }) => {
      try {
        const msg: Msg = JSON.parse(data);
        if (msg.t === "offer") {
          await session.acceptOffer({ type: "offer", sdp: msg.sdp });
          const { answer } = await session.createAnswer();
          const reply: Msg = { t: "answer", sdp: answer.sdp! };
          await Multipeer.sendToPeer(JSON.stringify(reply), peer);
        }
      } catch {}
    });
  }

  async stop() {
    try {
      if (this.advertiser) {
        await Multipeer.stopAdvertisingPeer(this.advertiser);
        this.advertiser = undefined;
      }
      if (this.browser) {
        await Multipeer.stopBrowsingForPeers(this.browser);
        this.browser = undefined;
      }
      if (this.connectedPeer) {
        try { await Multipeer.disconnect(this.connectedPeer); } catch {}
      }
    } catch {}
  }
}

export default new NearbySignaling();
