// Stockage OTP en mémoire (code, expiration, tentatives)
export interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
}

// Déclaration des globaux pour survivre aux rechargements de modules (Next.js dev mode)
declare global {
  // eslint-disable-next-line no-var
  var _otpStore: Map<string, OtpEntry> | undefined;
  // eslint-disable-next-line no-var
  var _sendRateLimit: Map<string, number[]> | undefined;
  // eslint-disable-next-line no-var
  var _otpCleanupStarted: boolean | undefined;
}

// Singleton via globalThis : persiste entre les rechargements de modules en dev
export const otpStore: Map<string, OtpEntry> =
  globalThis._otpStore ?? (globalThis._otpStore = new Map());

export const sendRateLimit: Map<string, number[]> =
  globalThis._sendRateLimit ?? (globalThis._sendRateLimit = new Map());

// Nettoyage des entrées expirées toutes les 10 minutes
if (typeof setInterval !== 'undefined' && !globalThis._otpCleanupStarted) {
  globalThis._otpCleanupStarted = true;
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
