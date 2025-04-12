import 'express-session';

declare module 'express-session' {
  export interface SessionData {
    userId?: number;
    oauthState?: string;
    isAdmin?: boolean;
  }
}