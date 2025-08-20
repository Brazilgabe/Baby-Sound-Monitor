import { WebRTCSession } from './WebRTCSession';

export interface HostResult {
  offerQR: string; // Base64 encoded offer SDP
}

export interface JoinResult {
  answerQR: string; // Base64 encoded answer SDP
}

export class LocalSignaling {
  private session: WebRTCSession;

  constructor(session: WebRTCSession) {
    this.session = session;
  }

  // For nursery device: start hosting and generate offer QR
  async startHost(mode: 'audio' | 'video'): Promise<HostResult> {
    // Initialize local media
    await this.session.initLocalMedia(mode);
    
    // Create offer
    const { offer } = await this.session.createOffer(mode);
    
    // Encode offer SDP as base64 for QR code
    const offerQR = btoa(JSON.stringify(offer));
    
    return { offerQR };
  }

  // For parent device: join using scanned offer and generate answer QR
  async joinAsParent(offerB64: string): Promise<JoinResult> {
    try {
      // Decode offer from base64
      const offerData = JSON.parse(atob(offerB64));
      
      // Initialize local media
      await this.session.initLocalMedia(offerData.video ? 'video' : 'audio');
      
      // Accept the offer
      await this.session.acceptOffer(offerData);
      
      // Create answer
      const { answer } = await this.session.createAnswer();
      
      // Encode answer SDP as base64 for QR code
      const answerQR = btoa(JSON.stringify(answer));
      
      return { answerQR };
    } catch (error) {
      throw new Error(`Failed to join session: ${error}`);
    }
  }

  // For nursery device: accept scanned answer
  async acceptAnswer(answerB64: string): Promise<void> {
    try {
      // Decode answer from base64
      const answerData = JSON.parse(atob(answerB64));
      
      // Accept the answer
      await this.session.acceptAnswer(answerData);
    } catch (error) {
      throw new Error(`Failed to accept answer: ${error}`);
    }
  }

  // Get the WebRTC session for stream access
  getSession(): WebRTCSession {
    return this.session;
  }
}
