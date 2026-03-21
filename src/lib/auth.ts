export type AuthUser = {
  email: string;
};

type StoredUser = {
  email: string;
  password: string;
};

const USERS_KEY = "ta_users_v1";
const SESSION_KEY = "ta_session_v1";
const PENDING_ACCOUNT_INFO_KEY = "ta_pending_account_info_v1";
const PASSWORD_RESET_EMAIL_KEY = "ta_password_reset_email_v1";
const PASSWORD_RESET_SENT_KEY = "ta_password_reset_sent_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readUsers(): StoredUser[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(USERS_KEY);
  const parsed = safeJsonParse<StoredUser[]>(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeUsers(users: StoredUser[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): AuthUser | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  const parsed = safeJsonParse<AuthUser>(raw);
  return parsed?.email ? parsed : null;
}

export function signOutMock() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function setPendingAccountInfoMock(value: boolean) {
  if (!isBrowser()) return;
  if (!value) {
    window.localStorage.removeItem(PENDING_ACCOUNT_INFO_KEY);
    return;
  }
  window.localStorage.setItem(PENDING_ACCOUNT_INFO_KEY, "1");
}

export function getPendingAccountInfoMock(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(PENDING_ACCOUNT_INFO_KEY) === "1";
}

export function clearPendingAccountInfoMock() {
  setPendingAccountInfoMock(false);
}

export function requestPasswordResetMock(email: string): {
  ok: true;
} | {
  ok: false;
  error: string;
} {
  if (!isBrowser()) return { ok: false, error: "Not running in browser." };

  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false, error: "Email is required." };

  // We do not reveal whether the account exists; this is a UI mock.
  window.localStorage.setItem(PASSWORD_RESET_EMAIL_KEY, normalized);
  window.localStorage.setItem(PASSWORD_RESET_SENT_KEY, "1");
  return { ok: true };
}

export function getPasswordResetEmailMock(): string | null {
  if (!isBrowser()) return null;
  const value = window.localStorage.getItem(PASSWORD_RESET_EMAIL_KEY);
  return value && value.length ? value : null;
}

export function isPasswordResetSentMock(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(PASSWORD_RESET_SENT_KEY) === "1";
}

export function clearPasswordResetMock() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PASSWORD_RESET_EMAIL_KEY);
  window.localStorage.removeItem(PASSWORD_RESET_SENT_KEY);
}

function writeSession(user: AuthUser) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function signUpWithGoogleMock(): {
  ok: true;
  user: AuthUser;
} | {
  ok: false;
  error: string;
} {
  if (!isBrowser()) return { ok: false, error: "Not running in browser." };

  // Mock OAuth account. We'll treat this as an already-verified identity.
  const email = "google.user@gmail.com";
  const password = "oauth_mock_password";

  const users = readUsers();
  const found = users.find((u) => u.email === email);

  if (!found) {
    writeUsers([...users, { email, password }]);
  }

  writeSession({ email });
  return { ok: true, user: { email } };
}

export function signUpMock(params: {
  email: string;
  password: string;
}): { ok: true; user: AuthUser } | { ok: false; error: string } {
  if (!isBrowser()) return { ok: false, error: "Not running in browser." };

  const email = params.email.trim().toLowerCase();
  const password = params.password;

  if (!email) return { ok: false, error: "Email is required." };
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: "This email is already registered." };
  }

  const nextUsers = [...users, { email, password }];
  writeUsers(nextUsers);

  const user: AuthUser = { email };
  writeSession(user);
  return { ok: true, user };
}

export function signInMock(params: {
  email: string;
  password: string;
}): { ok: true; user: AuthUser } | { ok: false; error: string } {
  if (!isBrowser()) return { ok: false, error: "Not running in browser." };

  const email = params.email.trim().toLowerCase();
  const password = params.password;

  if (!email) return { ok: false, error: "Email is required." };
  if (!password) return { ok: false, error: "Password is required." };

  const users = readUsers();
  const found = users.find((u) => u.email === email);
  if (!found) return { ok: false, error: "No account found for this email." };
  if (found.password !== password) {
    return { ok: false, error: "Incorrect password." };
  }

  const user: AuthUser = { email };
  writeSession(user);
  return { ok: true, user };
}

