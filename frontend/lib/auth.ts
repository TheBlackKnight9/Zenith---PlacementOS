/**
 * Client-Side Auth & Cookie Helpers
 * Sets HTTP-accessible cookies so Next.js Edge Middleware can guard routes synchronously.
 */

const TOKEN_KEY = "placementos_token";
const USER_KEY = "placementos_user";

export function setAuthSession(token: string, user: any) {
  if (typeof window === "undefined") return;

  // 1. Store in LocalStorage for client-side state
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // 2. Set Cookies for Edge Middleware (expires in 7 days)
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `user_role=${user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "user_role=; path=/; max-age=0";
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
