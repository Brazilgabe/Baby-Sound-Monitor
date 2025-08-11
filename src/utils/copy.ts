import { Platform, Share } from 'react-native';

export async function copyText(text: string) {
  try {
    if (Platform.OS === 'web' && 'clipboard' in navigator) {
      await (navigator as any).clipboard?.writeText(text);
      return { ok: true, msg: 'Copied to clipboard' };
    }
    // Fallback on native and any web where clipboard is unavailable
    await Share.share({ message: text });
    return { ok: true, msg: 'Shared' };
  } catch {
    return { ok: false, msg: 'Copy not available' };
  }
}