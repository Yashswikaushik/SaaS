import Razorpay from 'razorpay';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} env var is required`);
  return v;
}

let _client: Razorpay | null = null;

export function razorpayClient(): Razorpay {
  if (!_client) {
    _client = new Razorpay({
      key_id: requireEnv('RAZORPAY_KEY_ID'),
      key_secret: requireEnv('RAZORPAY_KEY_SECRET'),
    });
  }
  return _client;
}

export function isTestMode(): boolean {
  return (process.env.RAZORPAY_KEY_ID ?? '').startsWith('rzp_test_');
}
