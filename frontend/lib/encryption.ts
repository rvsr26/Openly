import CryptoJS from 'crypto-js';

// Deterministic key generation based on participant IDs
// This ensures both users generate the same key for their conversation
export const generateConversationKey = (uid1: string, uid2: string): string => {
    const sortedIds = [uid1, uid2].sort().join('_');
    const secretSalt = "OPENLY_SECURE_SALT_V1"; // In a real app, this should be an env var or derived from a secure handshake
    return CryptoJS.SHA256(sortedIds + secretSalt).toString();
};

export const encryptMessage = (message: string, key: string): string => {
    try {
        return CryptoJS.AES.encrypt(message, key).toString();
    } catch (e) {
        console.error("Encryption failed:", e);
        return message;
    }
};

export const decryptMessage = (encryptedMessage: string, key: string): string => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted || encryptedMessage; // Fallback to original if empty (e.g. malformed)
    } catch (e) {
        console.error("Decryption failed:", e);
        return encryptedMessage; // Return original if decryption fails (might be unencrypted legacy msg)
    }
};
