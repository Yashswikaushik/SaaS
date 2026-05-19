// Client-safe barrel. Server-only modules (consent-manager) must be imported
// from their explicit subpath: `@bharat/dpdp/consent-manager`.
export * from './scopes';
export * from './errors';
export * from './optout-keywords';
