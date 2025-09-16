// Simple encryption for client-side storage
// Note: This is basic obfuscation for local storage. For production, consider more robust encryption.

const ENCRYPTION_KEY = 'email-composer-smtp-key-2024';

export const encryptString = (text: string): string => {
  try {
    const encoded = btoa(unescape(encodeURIComponent(text + ENCRYPTION_KEY)));
    return encoded.split('').reverse().join('');
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
};

export const decryptString = (encryptedText: string): string => {
  try {
    const reversed = encryptedText.split('').reverse().join('');
    const decoded = decodeURIComponent(escape(atob(reversed)));
    return decoded.replace(ENCRYPTION_KEY, '');
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
};

export const encryptObject = (obj: unknown): string => {
  try {
    const jsonString = JSON.stringify(obj);
    return encryptString(jsonString);
  } catch (error) {
    console.error('Object encryption failed:', error);
    return '';
  }
};

export const decryptObject = <T>(encryptedString: string): T | null => {
  try {
    const decryptedString = decryptString(encryptedString);
    return JSON.parse(decryptedString) as T;
  } catch (error) {
    console.error('Object decryption failed:', error);
    return null;
  }
};
