import { setAdminTokenProvider } from "./crmApi";
import { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  type Auth,
  initializeAuth,
  inMemoryPersistence,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  connectAuthEmulator,
} from "firebase/auth";
// @ts-expect-error Shared JS controller has emulator and race-condition tests.
import { createAdminLogin } from "../experiments/firebase/integration/web/admin-login.mjs";
let staffAuth: Auth | undefined;
type State = {
  phase: string;
  message: string;
  busy: boolean;
  email: string;
  authorized: boolean;
  verified: boolean;
  retryAfterMs: number;
};
export function FirebaseAdminLogin({
  children,
}: {
  children: (token: string, logout: () => void) => React.ReactNode;
}) {
  const [state, setState] = useState<State>({
    phase: "signed-out",
    message: "",
    busy: false,
    email: "",
    authorized: false,
    verified: false,
    retryAfterMs: 0,
  });
  const [token, setToken] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState("");
  const controller = useRef<ReturnType<typeof createAdminLogin>>(null);
  useEffect(() => {
    try {
      const raw = (import.meta as unknown as { env: Record<string, string> })
        .env;
      const config = JSON.parse(raw.VITE_FIREBASE_CONFIG || "null");
      if (
        !config ||
        !config.apiKey ||
        !config.authDomain ||
        !config.appId ||
        !["mateshwari-travellers", "demo-mateshwari-poc"].includes(
          config.projectId,
        )
      )
        throw Error();
      const first = !staffAuth;
      const auth = (staffAuth ??= initializeAuth(
        initializeApp(config, "mateshwari-staff"),
        { persistence: inMemoryPersistence },
      ));
      if (first && config.projectId === "demo-mateshwari-poc") {
        if (!["127.0.0.1", "localhost"].includes(location.hostname))
          throw Error();
        connectAuthEmulator(auth, "http://127.0.0.1:9099", {
          disableWarnings: true,
        });
      }
      const c = createAdminLogin({
        auth,
        sdk: {
          onAuthStateChanged,
          reload,
          sendEmailVerification,
          signInWithEmailAndPassword,
          signOut,
        },
        authorize: async (value: string) => {
          const r = await fetch("/api/admin/session", {
            headers: { Authorization: "Bearer " + value },
          });
          return r.ok && (await r.json()).authorized === true;
        },
        onChange: (next: State) => {
          setState(next);
          if (!next.authorized) setToken("");
          else void auth.currentUser?.getIdToken().then(setToken);
        },
      });
      controller.current = c;
      const stop = c.start();
      setAdminTokenProvider(() => c.adminToken());
      const expired = () => c.lock();
      window.addEventListener("mt-admin-expired", expired);
      return () => {
        stop();
        setAdminTokenProvider(null);
        window.removeEventListener("mt-admin-expired", expired);
      };
    } catch {
      setError("Admin sign-in is not configured. The CRM remains locked.");
    }
  }, []);
  if (state.authorized && token)
    return (
      <>
        {children(token, () => {
          setToken("");
          void controller.current?.signOut();
        })}
      </>
    );
  return (
    <main className="crm-page">
      <header className="crm-header">
        <a href="/">← MATESHWARI TRAVELLERS</a>
      </header>
      <section className="crm-sign-in">
        <span className="crm-eyebrow">Operations workspace</span>
        <h1>Bookings deserve a better workflow.</h1>
        <p>
          Sign in with your staff account. Verified email and server
          authorization are required.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = password;
            setPassword("");
            void controller.current?.signIn(
              "mateshwaritravellers@gmail.com",
              value,
            );
          }}
        >
          <label>
            Email
            <input
              type="email"
              value="mateshwaritravellers@gmail.com"
              autoComplete="username"
              readOnly
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button disabled={state.busy || !!error} type="submit">
            {state.busy ? "Checking…" : "Sign in"}
          </button>
        </form>
        {state.email && (
          <div>
            <button
              type="button"
              disabled={state.busy || state.verified}
              onClick={() => void controller.current?.sendVerification()}
            >
              Send verification email
            </button>
            <button
              type="button"
              disabled={state.busy}
              onClick={() => void controller.current?.refresh()}
            >
              I’ve verified — refresh status
            </button>
            <button
              type="button"
              onClick={() => void controller.current?.signOut()}
            >
              Sign out
            </button>
          </div>
        )}
        <p role="status" aria-live="polite">
          {error || state.message}
        </p>
      </section>
    </main>
  );
}
