export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "user";
  onboardingComplete?: boolean;
  name?: string | null;
  gender?: string | null;
  preferences?: any | null;
}