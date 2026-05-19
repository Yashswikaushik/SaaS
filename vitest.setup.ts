// Vitest global setup. Run with: vitest --setup vitest.setup.ts (configured in vitest.config.ts).
process.env.IP_HASH_SALT ??= 'test-salt-32-chars-minimum-1234567890';
process.env.OTP_HMAC_SECRET ??= 'test-otp-hmac-secret-32-chars-min-12345';
process.env.NODE_ENV ??= 'test';
