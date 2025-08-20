import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

// Helper function to wait for complete ICE gathering
function waitForCompleteIce(pc: RTCPeerConnection) {
  return new Promise<void>((res) => {
    if (pc.iceGatheringState === "complete") return res();
    const h = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", h);
        res();
      }
    };
    pc.addEventListener("icegatheringstatechange", h);
  });
}

export class WebRTCSession {
  private pc?: RTCPeerConnection;
  private _localStream?: MediaStream;
  private _remoteStream?: MediaStream;
  private _listeners: { [key: string]: Function[] } = {};

  private _emit(event: string, data: any) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(listener => listener(data));
    }
  }

  on(event: string, callback: Function) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(listener => listener !== callback);
    }
  }

  private makePc() {
    if (this.pc) return;
    
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });

    // Set up event handlers
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate generated:', event.candidate);
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', this.pc?.connectionState);
    };

    this.pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received');
    };
  }

  // Call this before createOffer() on the nursery side, and before createAnswer() on the parent side.
  async initLocalMedia(kind: 'audio' | 'video') {
    // Request mic (and camera if video)
    const constraints =
      kind === 'audio'
        ? { audio: true, video: false }
        : {
            audio: true,
            video: {
              facingMode: 'user',
              width: 640,
              height: 360,
              frameRate: 24,
            },
          };

    this._localStream = await mediaDevices.getUserMedia(constraints);

    // Add all local tracks to the peer connection
    this._localStream.getTracks().forEach((t) => this.pc!.addTrack(t, this._localStream!));

    // Prepare a remote stream container and expose it
    this._remoteStream = new MediaStream();
    this.pc!.ontrack = (ev) => {
      ev.streams[0]?.getTracks().forEach((t) => this._remoteStream!.addTrack(t));
      this._emit('remoteStream', this._remoteStream!);
    };

    // Emit local stream for UI preview if you want
    this._emit('localStream', this._localStream);
  }

  async createOffer(mode: "audio" | "video") {
    this.makePc();
    
    // Initialize local media (mic + camera if video)
    await this.initLocalMedia(mode === "video" ? "video" : "audio");

    // Create offer
    this.pc!.onicecandidate = () => {}; // non-trickle; rely on complete SDP
    const offer = await this.pc!.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: mode === "video",
    });
    
    await this.pc!.setLocalDescription(offer);
    await waitForCompleteIce(this.pc!);
    
    return { offer: this.pc!.localDescription! };
  }

  async acceptOffer(offer: RTCSessionDescriptionInit) {
    this.makePc();
    this.pc!.onicecandidate = () => {};
    await this.pc!.setRemoteDescription(offer);
  }

  async createAnswer() {
    const answer = await this.pc!.createAnswer();
    await this.pc!.setLocalDescription(answer);
    await waitForCompleteIce(this.pc!);
    return { answer: this.pc!.localDescription! };
  }

  async acceptAnswer(answer: RTCSessionDescriptionInit) {
    await this.pc!.setRemoteDescription(answer);
  }

  async close() {
    try {
      if (this.pc) {
        this.pc.close();
        this.pc = undefined;
      }
    } finally {
      if (this._localStream) {
        this._localStream.getTracks().forEach(track => track.stop());
        this._localStream = undefined;
      }
      this._remoteStream = undefined;
    }
  }

  get localStream() { return this._localStream; }
  get remoteStream() { return this._remoteStream; }

  getPeerConnection(): RTCPeerConnection | undefined {
    return this.pc;
  }
}

export default WebRTCSession;
