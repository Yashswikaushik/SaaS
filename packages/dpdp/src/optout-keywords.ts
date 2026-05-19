/**
 * Multi-language opt-out keyword matcher.
 * Returns true if the trimmed, case-folded message body is an opt-out trigger.
 */

const OPT_OUT_KEYWORDS = new Set<string>([
  // English
  'stop', 'unsubscribe', 'no', 'stopall', 'optout', 'opt out', 'remove me', 'cancel',
  // Hindi (Devanagari)
  'रोकें', 'बंद', 'मना', 'हटाओ', 'अनसब्सक्राइब',
  // Tamil
  'நிறுத்து', 'வேண்டாம்', 'நிறுத்து',
  // Telugu
  'ఆపండి', 'వద్దు',
  // Kannada
  'ರೋಕು', 'ಬೇಡ', 'ನಿಲ್ಲಿಸಿ',
  // Bengali
  'থামাও', 'না', 'বন্ধ',
  // Marathi
  'थांबवा', 'नको', 'बंद',
  // Gujarati
  'બંધ', 'નથી',
]);

export function isOptOutMessage(body: string): boolean {
  if (!body) return false;
  const normalized = body.trim().toLowerCase();
  if (OPT_OUT_KEYWORDS.has(normalized)) return true;
  // tolerate punctuation: "STOP." "stop!" "stop."
  const stripped = normalized.replace(/[.!?,\s]+$/g, '').replace(/^[.!?,\s]+/g, '');
  return OPT_OUT_KEYWORDS.has(stripped);
}
