import * as Keychain from "react-native-keychain";

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; [key: string]: any };
};

export type StoredSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: AuthUser;
};

const OPTIONS = {
  service: "fitconnect.session",

  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let cache: StoredSession | null = null;
let loaded = false;
let persist = true;
let loadingPromise: Promise<StoredSession | null> | null = null;

let generation = 0;

let queue: Promise<unknown> = Promise.resolve();
const enqueue = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
};

export const tokenStorage = {
  generation: () => generation,

  load(): Promise<StoredSession | null> {
    if (loaded) return Promise.resolve(cache);
    if (!loadingPromise) {
      loadingPromise = (async () => {
        try {
          const creds = await Keychain.getGenericPassword(OPTIONS);
          cache = creds ? (JSON.parse(creds.password) as StoredSession) : null;
          if (creds) persist = true;
        } catch {
          cache = null;
        }
        loaded = true;
        return cache;
      })().finally(() => {
        loadingPromise = null;
      });
    }
    return loadingPromise;
  },

  save(session: StoredSession, opts?: { persist?: boolean }) {
    if (opts?.persist !== undefined) persist = opts.persist;
    cache = session;
    loaded = true;
    const shouldPersist = persist;

    return enqueue(async () => {
      if (shouldPersist) {
        await Keychain.setGenericPassword("session", JSON.stringify(session), OPTIONS);
      } else {
        await Keychain.resetGenericPassword({ service: OPTIONS.service });
      }
    });
  },

  clear() {
    generation += 1;
    cache = null;
    loaded = true;
    return enqueue(() =>
      Keychain.resetGenericPassword({ service: OPTIONS.service }).then(() => undefined),
    );
  },
};
