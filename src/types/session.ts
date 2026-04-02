export const SESSION_VERSION = 1;

export interface Session {
  version: number;
  token: string;
  capturedAt: string;
}
