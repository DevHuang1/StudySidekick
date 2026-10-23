export const AUTH_STORAGE_KEY = "study-sidekick.auth.v1";
export const DEMO_PASSWORD = "DEVPOST";
export const AUTH_USERNAMES = ["User", "Judge"] as const;

export type AuthUsername = (typeof AUTH_USERNAMES)[number];

export type AuthSession = {
  username: AuthUsername;
  signedInAt: string;
};

export type AuthSnapshot = {
  ready: boolean;
  session: AuthSession | null;
};

export type SignInResult = { ok: true; session: AuthSession } | { ok: false; error: string };

type Listener = () => void;

const listeners = new Set<Listener>();
const SERVER_SNAPSHOT: AuthSnapshot = { ready: false, session: null };

let snapshot: AuthSnapshot = SERVER_SNAPSHOT;
let loaded = false;
let storageListenerAttached = false;

export function isAuthUsername(value: unknown): value is AuthUsername {
  return typeof value === "string" && (AUTH_USERNAMES as readonly string[]).includes(value);
}

/** The demo password is case-sensitive; surrounding whitespace is forgiven. */
export function isDemoPassword(password: string): boolean {
  return password.trim() === DEMO_PASSWORD;
}

export function parseAuthSession(raw: string | null): AuthSession | null {
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;

    const { username, signedInAt } = value as Record<string, unknown>;
    if (!isAuthUsername(username) || typeof signedInAt !== "string") return null;
    if (Number.isNaN(Date.parse(signedInAt))) return null;

    return { username, signedInAt };
  } catch {
    return null;
  }
}

function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    return parseAuthSession(window.localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  snapshot = { ready: true, session: readAuthSession() };
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== null && event.key !== AUTH_STORAGE_KEY) return;
  loaded = true;
  snapshot = { ready: true, session: readAuthSession() };
  emit();
}

export function subscribeToAuth(listener: Listener): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined" && !storageListenerAttached) {
    storageListenerAttached = true;
    window.addEventListener("storage", handleStorageEvent);
  }

  return () => {
    listeners.delete(listener);
  };
}

/** Cached so useSyncExternalStore receives a stable snapshot between writes. */
export function getAuthSnapshot(): AuthSnapshot {
  ensureLoaded();
  return snapshot;
}

/** Keep the server and hydration render logged out until storage has been read. */
export function getServerAuthSnapshot(): AuthSnapshot {
  return SERVER_SNAPSHOT;
}

export function signIn(username: string, password: string): SignInResult {
  if (!isAuthUsername(username)) {
    return { ok: false, error: "Choose User or Judge to continue." };
  }
  if (!isDemoPassword(password)) {
    return { ok: false, error: "That password doesn't match." };
  }

  const session: AuthSession = { username, signedInAt: new Date().toISOString() };
  loaded = true;
  snapshot = { ready: true, session };

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // The session still works for this page when storage is unavailable.
  }

  emit();
  return { ok: true, session };
}

export function signOut() {
  loaded = true;
  snapshot = { ready: true, session: null };

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Nothing else is needed when storage is unavailable.
  }

  emit();
}
