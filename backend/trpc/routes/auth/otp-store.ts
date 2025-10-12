type OtpMap = Record<string, { code: string; expiresAt: number }>;

const store: OtpMap = {};

export function setOtp(phone: string, code: string, ttlMs = 5 * 60 * 1000) {
  const clean = phone.replace(/\D/g, '');
  store[clean] = { code, expiresAt: Date.now() + ttlMs };
}

export function verifyOtpCode(phone: string, code: string): boolean {
  const clean = phone.replace(/\D/g, '');
  const entry = store[clean];
  if (!entry) return false;
  const valid = entry.code === code && Date.now() < entry.expiresAt;
  if (valid) delete store[clean];
  return valid;
}

export function debugGetOtp(phone: string): string | undefined {
  const clean = phone.replace(/\D/g, '');
  return store[clean]?.code;
}
