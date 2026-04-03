export type { Session } from './session.js';
export { SESSION_VERSION } from './session.js';
export type { UserProfile } from './user.js';
export type { Client } from './client.js';
export type { Form } from './form.js';

export interface OutputEnvelope<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
