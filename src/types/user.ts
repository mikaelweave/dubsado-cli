export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  locale: string;
  isLocked: boolean;
  isSoftLocked: boolean;
  isUnverified: boolean;
  createdAt: string;
}
