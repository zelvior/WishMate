import { BirthdayWishConfig } from "../types";

/**
 * Encodes a BirthdayWishConfig into a compact, URI-safe Base64 string.
 * Supports Unicode/Emoji characters safely.
 */
export function encodeConfig(config: BirthdayWishConfig): string {
  try {
    const jsonStr = JSON.stringify(config);
    // Encode as UTF-8 bytes to correctly support emojis and accents
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = "";
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const base64 = btoa(binary);
    // Make standard Base64 URI-safe (replace + with -, / with _, and trim padding)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error("Failed to encode wish config:", err);
    return "";
  }
}

/**
 * Decodes a URI-safe Base64 string back into a BirthdayWishConfig.
 * Handles Unicode/Emoji conversion correctly.
 */
export function decodeConfig(str: string): BirthdayWishConfig | null {
  if (!str) return null;
  try {
    // Restore standard Base64 characters and padding
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr) as BirthdayWishConfig;
  } catch (err) {
    console.error("Failed to decode wish config:", err);
    return null;
  }
}
