export type UserRole = "student" | "teacher" | "admin" | "superadmin";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  xp: number;
  level: number;
  streakDays: number;
}
