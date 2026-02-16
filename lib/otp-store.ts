// Stockage OTP en mémoire (code, expiration, tentatives)
export interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
}

// Map globale pour stocker les OTPs (clé = numéro de téléphone)
export const otpStore = new Map<string, OtpEntry>();

// Rate limiting : envois par téléphone (clé = téléphone, valeur = timestamps)
export const sendRateLimit = new Map<string, number[]>();

// Nettoyage des entrées expirées toutes les 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    otpStore.forEach((entry, key) => {
      if (now > entry.expiresAt) otpStore.delete(key);
    });
    sendRateLimit.forEach((timestamps, key) => {
      const recent = timestamps.filter(t => now - t < 10 * 60 * 1000);
      if (recent.length === 0) sendRateLimit.delete(key);
      else sendRateLimit.set(key, recent);
    });
  }, 10 * 60 * 1000);
}
