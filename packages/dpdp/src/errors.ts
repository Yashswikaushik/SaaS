export class DpdpError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DpdpError';
  }
}

export class DpdpConsentMissingError extends DpdpError {
  constructor(scope: string, userId: string) {
    super(
      `Consent for scope '${scope}' is not granted by user ${userId}`,
      'DPDP_CONSENT_MISSING',
      { scope, userId },
    );
  }
}

export class DpdpNoticeStaleError extends DpdpError {
  constructor(userId: string, agreedVersion: string, currentVersion: string) {
    super(
      `User ${userId} agreed to notice ${agreedVersion}, current is ${currentVersion}`,
      'DPDP_NOTICE_STALE',
      { userId, agreedVersion, currentVersion },
    );
  }
}
