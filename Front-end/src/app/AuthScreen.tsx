import { type FormEvent, useState } from "react";
import { Leaf, LoaderCircle } from "lucide-react";
import {
  type AuthAdapter,
  AuthConfirmationRequiredError,
  type AuthSession,
  type LoginErrors,
  type SignupErrors,
  validateLogin,
  validateSignup,
} from "./auth";

type AuthMode = "login" | "signup";

interface AuthScreenProps {
  adapter: AuthAdapter;
  onAuthenticated: (session: AuthSession) => void;
}

const fieldClass =
  "h-11 w-full rounded-[10px] border border-[#D9CEC4] bg-white px-3.5 text-sm text-[#2F2925] outline-none transition focus:border-[#7A3E24] focus:ring-2 focus:ring-[#7A3E24]/15 aria-[invalid=true]:border-[#B8443C] aria-[invalid=true]:ring-[#B8443C]/10";

export function AuthScreen({ adapter, onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<LoginErrors | SignupErrors>({});
  const [requestError, setRequestError] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [pending, setPending] = useState(false);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
    setPasswordConfirmation("");
    setErrors({});
    setRequestError("");
    setConfirmationMessage("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = mode === "login"
      ? validateLogin({ email, password })
      : validateSignup({ email, password, passwordConfirmation });
    setErrors(nextErrors);
    setRequestError("");
    setConfirmationMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      const session = mode === "login"
        ? await adapter.signIn({ email, password })
        : await adapter.signUp({ email, password, passwordConfirmation });
      onAuthenticated(session);
    } catch (error) {
      if (error instanceof AuthConfirmationRequiredError) {
        setConfirmationMessage(error.message);
        setMode("login");
        setPassword("");
        setPasswordConfirmation("");
      } else {
        setRequestError(error instanceof Error ? error.message : "Authentication failed. Please try again.");
      }
    } finally {
      setPending(false);
    }
  };

  const title = mode === "login" ? "Welcome back" : "Create your bakery account";
  const description = mode === "login"
    ? "Sign in to plan today’s bake."
    : "Start with one secure owner account.";

  return (
    <main className="min-h-screen bg-[#FBF8F3] px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(320px,0.9fr)_minmax(480px,1.1fr)] lg:items-stretch lg:p-0">
      <section className="mx-auto flex w-full max-w-md flex-col justify-center lg:max-w-none lg:px-[clamp(3rem,8vw,8rem)]">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#7A3E24]">
            <Leaf size={20} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="font-extrabold text-[#2F2925]">Earl&apos;s Bakery</p>
            <p className="text-xs text-[#988D84]">Production Studio</p>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#E5DDD3] bg-white p-6 shadow-[0_20px_60px_rgba(73,47,32,0.08)] sm:p-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A3E24]">
            Owner access
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#2F2925]">{title}</h1>
          <p className="mt-2 text-sm text-[#6F655E]">{description}</p>

          <form className="mt-7 space-y-4" onSubmit={submit} noValidate>
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-bold text-[#403832]">
                Email address
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "auth-email-error" : undefined}
                className={fieldClass}
                placeholder="owner@earlsbakery.com"
              />
              {errors.email && <p id="auth-email-error" className="mt-1.5 text-xs font-semibold text-[#B8443C]">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-bold text-[#403832]">
                Password
              </label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={event => setPassword(event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "auth-password-error" : undefined}
                className={fieldClass}
              />
              {errors.password && <p id="auth-password-error" className="mt-1.5 text-xs font-semibold text-[#B8443C]">{errors.password}</p>}
            </div>

            {mode === "signup" && (
              <div>
                <label htmlFor="auth-password-confirmation" className="mb-1.5 block text-sm font-bold text-[#403832]">
                  Confirm password
                </label>
                <input
                  id="auth-password-confirmation"
                  name="passwordConfirmation"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={event => setPasswordConfirmation(event.target.value)}
                  aria-invalid={Boolean((errors as SignupErrors).passwordConfirmation)}
                  aria-describedby={(errors as SignupErrors).passwordConfirmation ? "auth-password-confirmation-error" : undefined}
                  className={fieldClass}
                />
                {(errors as SignupErrors).passwordConfirmation && (
                  <p id="auth-password-confirmation-error" className="mt-1.5 text-xs font-semibold text-[#B8443C]">
                    {(errors as SignupErrors).passwordConfirmation}
                  </p>
                )}
              </div>
            )}

            {requestError && (
              <div role="alert" className="rounded-[10px] border border-[#EBC7C3] bg-[#FCE9E7] px-3.5 py-3 text-sm font-semibold text-[#9B3933]">
                {requestError}
              </div>
            )}
            {confirmationMessage && (
              <div role="status" className="rounded-[10px] border border-[#BFD9C5] bg-[#EDF8EF] px-3.5 py-3 text-sm font-semibold text-[#356344]">
                {confirmationMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#7A3E24] text-sm font-bold text-white transition hover:bg-[#934E2E] disabled:cursor-wait disabled:opacity-70"
            >
              {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              {pending ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6F655E]">
            {mode === "login" ? "New to Earl’s Bakery?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="font-bold text-[#7A3E24] underline-offset-4 hover:underline"
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-[#988D84]">
          Secure accounts and sessions are provided by Supabase Auth.
        </p>
      </section>

      <aside className="hidden bg-[#432719] p-12 text-[#FFF9F4] lg:flex lg:flex-col lg:justify-between">
        <div className="max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E6BFA9]">Bake with clarity</p>
          <p className="mt-6 text-[clamp(2.5rem,4vw,4.75rem)] font-extrabold leading-[0.98] tracking-[-0.045em]">
            From first feed to final pickup.
          </p>
          <p className="mt-7 max-w-md text-base leading-7 text-[#E8D8CE]">
            Keep orders, production, starter, inventory, and profit in one calm daily workspace.
          </p>
        </div>
        <div className="grid max-w-xl grid-cols-3 gap-3 text-sm">
          {["Plan the bake", "Track every task", "Know the margin"].map((label, index) => (
            <div key={label} className="rounded-[14px] border border-white/15 bg-white/5 p-4">
              <p className="font-['DM_Mono',monospace] text-xs text-[#E6BFA9]">0{index + 1}</p>
              <p className="mt-2 font-bold">{label}</p>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
