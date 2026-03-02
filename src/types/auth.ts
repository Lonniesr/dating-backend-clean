export interface AuthUser {
  id: string;
  email: string;
  role: string;                 // ✅ ADD THIS
  onboardingComplete: boolean;
  name: string | null;
  gender: string | null;
  preferences: any | null;
}