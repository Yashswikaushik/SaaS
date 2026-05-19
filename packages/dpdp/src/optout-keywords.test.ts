import { describe, expect, it } from 'vitest';
import { isOptOutMessage } from './optout-keywords';

describe('isOptOutMessage', () => {
  it.each(['STOP', 'stop', ' Stop ', 'STOP.', 'unsubscribe', 'cancel'])(
    'detects English opt-out: %s',
    (k) => expect(isOptOutMessage(k)).toBe(true),
  );

  it.each(['रोकें', 'बंद', 'मना', 'अनसब्सक्राइब'])('detects Hindi opt-out: %s', (k) =>
    expect(isOptOutMessage(k)).toBe(true),
  );

  it.each(['நிறுத்து', 'வேண்டாம்'])('detects Tamil opt-out: %s', (k) =>
    expect(isOptOutMessage(k)).toBe(true),
  );

  it.each(['ఆపండి', 'వద్దు'])('detects Telugu opt-out: %s', (k) =>
    expect(isOptOutMessage(k)).toBe(true),
  );

  it.each(['hello', 'thanks', 'interested', 'tell me more', ''])(
    'returns false for non-opt-out: %s',
    (k) => expect(isOptOutMessage(k)).toBe(false),
  );
});
