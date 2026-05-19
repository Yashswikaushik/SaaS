import { uuidv7 } from 'uuidv7';

/** Sortable, time-ordered UUID v7. Better than v4 for index locality. */
export function newId(): string {
  return uuidv7();
}

/**
 * Branded ID types — prevents passing a user_id where a lead_id is expected.
 * Use `IdOf<'user'>` in function signatures.
 */
declare const __brand: unique symbol;
export type IdOf<T extends string> = string & { readonly [__brand]: T };

export const asId = <T extends string>(s: string): IdOf<T> => s as IdOf<T>;
