import { setAdminTokenProvider } from "./crmApi";
import { useEffect, useRef, useState } from "react";
import { initializeApp, getApp } from "firebase/app";
import {
  type Auth,
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  signInWithPopup,
  linkWithCredential,
  getAdditionalUserInfo,
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
// Google is optional: Firebase's Google provider must be explicitly enabled
// by the owner before we offer a popup/linking path. Password login works
// independently and is the supported launch authentication method.
const googleStaffAuthEnabled = (import.meta as unknown as { env: Record<string, string> })
  .env.VITE_GOOGLE_STAFF_AUTH_ENABLED === "true";
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
  const [googleBusy, setGoogleBusy] = useState(false);
  const googlePending = useRef(false);
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
        { persistence: inMemoryPersistence, popupRedirectResolver: browserPopupRedirectResolver },
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
          const type = r.headers.get("content-type") || "";
          if ((r.status === 404 || r.status === 200) && !type.includes("application/json")) {
            setError("This static preview has no running CRM API. Open the approved Netlify site with its secure Functions backend to use Admin.");
            return false;
          }
          if (r.status >= 500) {
            setError("The CRM server is unavailable (HTTP " + r.status + "). Admin remains locked until the server is available.");
            return false;
          }
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
  async function google(link = false) {
    if (!googleStaffAuthEnabled || !staffAuth || googlePending.current) return;
    googlePending.current = true;
    setGoogleBusy(true);
    setError("");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      if (link) {
        await controller.current?.adminToken();
        const user = staffAuth.currentUser;
        if (!user) throw Error();
        let linkAuth: Auth;
        try { linkAuth = initializeAuth(getApp("mateshwari-google-link"), { persistence: inMemoryPersistence, popupRedirectResolver: browserPopupRedirectResolver }); }
        catch {
          linkAuth = initializeAuth(initializeApp(staffAuth.app.options, "mateshwari-google-link"), { persistence: inMemoryPersistence, popupRedirectResolver: browserPopupRedirectResolver });
          if (staffAuth.app.options.projectId === "demo-mateshwari-poc") connectAuthEmulator(linkAuth, "http://127.0.0.1:9099", { disableWarnings: true });
        }
        try {
          const result = await signInWithPopup(linkAuth, provider);
          const profile = getAdditionalUserInfo(result)?.profile;
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (!credential || profile?.email !== user.email || profile?.verified_email !== true || staffAuth.currentUser !== user) throw Error();
          await controller.current?.adminToken();
          await linkWithCredential(user, credential);
        } finally { await signOut(linkAuth); }
      } else {
        await signInWithPopup(staffAuth, provider);
      }
      await controller.current?.refresh();
    } catch (cause) {
      const code = (cause as { code?: string })?.code;
      setError(code === "auth/operation-not-allowed"
        ? "Google sign-in is not enabled in Firebase Authentication. Continue with your verified staff password."
        : code === "auth/popup-blocked"
          ? "Safari blocked the Google sign-in popup. Allow popups for this site before retrying."
          : code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request"
            ? "Google sign-in was cancelled. Your existing staff password remains available."
            : "Google sign-in or linking could not be completed. Use your verified staff password; the Admin CRM remains available.");
    } finally { googlePending.current = false; setGoogleBusy(false); }
  }
  if (state.authorized && token)
    return (
      <>
        {googleStaffAuthEnabled && <div className="crm-google-toolbar">
          <button type="button" disabled={googleBusy} onClick={() => void google(true)}>Link Google to this Admin account</button>
          {error && <p role="status">{error}</p>}
        </div>}
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
            setError("");
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
          <button disabled={state.busy || googleBusy} type="submit">
            {state.busy ? "Checking…" : "Sign in"}
          </button>
        </form>
        {googleStaffAuthEnabled && <button type="button" disabled={state.busy || googleBusy} onClick={() => void google()}>Sign in with Google</button>}
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
