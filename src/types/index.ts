export type { Session } from './session.js';
export { SESSION_VERSION } from './session.js';
export type { UserProfile } from './user.js';

export interface OutputEnvelope<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
