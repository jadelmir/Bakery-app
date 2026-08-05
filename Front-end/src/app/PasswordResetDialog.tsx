import { type FormEvent, useState } from "react";
import { KeyRound, LoaderCircle, X } from "lucide-react";
import { supabaseAuthAdapter, type AuthAdapter } from "./auth";
import { requestPasswordReset } from "../lib/supabase/client";

export type ResetMode = "request" | "update";

export interface PasswordResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  authAdapter?: AuthAdapter;
  initialMode?: ResetMode;
  defaultEmail?: string;
  onSuccess?: () => void;
  initialError?: string;
  onRequestPasswordReset?: (email: string) => Promise<void>;
}

const fieldClass =
  "h-11 w-full rounded-[10px] border border-[#D9CEC4] bg-white px-3.5 text-sm text-[#2F2925] outline-none transition focus:border-[#7A3E24] focus:ring-2 focus:ring-[#7A3E24]/15 aria-[invalid=true]:border-[#B8443C] aria-[invalid=true]:ring-[#B8443C]/10";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PasswordResetDialog({
  isOpen,
  onClose,
  authAdapter = supabaseAuthAdapter,
  initialMode = "request",
  defaultEmail = "",
  onSuccess,
  initialError = "",
  onRequestPasswordReset = requestPasswordReset,
}: PasswordResetDialogProps) {
  const mode = initialMode;
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [requestError, setRequestError] = useState(initialError);
  const [statusMessage, setStatusMessage] = useState("");
  const [pending, setPending] = useState(false);

  if (!isOpen) return null;

  const validateRequest = () => {
    if (!email.trim() || !EMAIL_PATTERN.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateUpdate = () => {
    let valid = true;
    if (!password || password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (!passwordConfirmation) {
      setConfirmError("Confirm your new password.");
      valid = false;
    } else if (passwordConfirmation !== password) {
      setConfirmError("Passwords do not match.");
      valid = false;
    } else {
      setConfirmError("");
    }
    return valid;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError("");
    setStatusMessage("");

    if (mode === "request") {
      if (!validateRequest()) return;
      setPending(true);
      try {
        await onRequestPasswordReset(email);
        setStatusMessage("Password reset email sent! Check your inbox for further instructions.");
        if (onSuccess) onSuccess();
      } catch (err) {
        // Fallback for offline/mock mode
        if (import.meta.env.VITE_USE_MOCK_BACKEND === "true") {
          setStatusMessage("Mock mode: Password reset email sent for " + email.trim());
          if (onSuccess) onSuccess();
        } else {
          setRequestError(err instanceof Error ? err.message : "Failed to request password reset.");
        }
      } finally {
        setPending(false);
      }
    } else {
      if (!validateUpdate()) return;
      setPending(true);
      try {
        await authAdapter.updatePassword(password);
        try {
          await authAdapter.signOut();
        } catch {
          throw new Error(
            "Your password was updated, but we couldn't end the recovery session. Please try again.",
          );
        }
        setStatusMessage("Password updated successfully! You can now log in with your new password.");
        setPassword("");
        setPasswordConfirmation("");
        if (onSuccess) onSuccess();
      } catch (err) {
        setRequestError(err instanceof Error ? err.message : "Failed to update password.");
      } finally {
        setPending(false);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-reset-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F2925]/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-[20px] border border-[#E5DDD3] bg-white p-6 shadow-[0_20px_60px_rgba(73,47,32,0.15)] sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#7A3E24]/10 text-[#7A3E24]">
              <KeyRound size={18} aria-hidden="true" />
            </div>
            <h2 id="password-reset-title" className="text-xl font-extrabold text-[#2F2925]">
              {mode === "request" ? "Reset your password" : "Set new password"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#988D84] transition hover:bg-[#F6F0E8] hover:text-[#2F2925]"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          {mode === "request" ? (
            <div>
              <label htmlFor="reset-email" className="mb-1.5 block text-sm font-bold text-[#403832]">
                Email address
              </label>
              <div className="relative">
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "reset-email-error" : undefined}
                  className={fieldClass}
                  placeholder="owner@earlsbakery.com"
                />
              </div>
              {emailError && (
                <p id="reset-email-error" className="mt-1.5 text-xs font-semibold text-[#B8443C]">
                  {emailError}
                </p>
              )}
              <p className="mt-2 text-xs text-[#6F655E]">
                We’ll send a secure password reset link to your registered email address.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="reset-new-password"
                  className="mb-1.5 block text-sm font-bold text-[#403832]"
                >
                  New password
                </label>
                <input
                  id="reset-new-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "reset-password-error" : undefined}
                  className={fieldClass}
                  placeholder="At least 8 characters"
                />
                {passwordError && (
                  <p id="reset-password-error" className="mt-1.5 text-xs font-semibold text-[#B8443C]">
                    {passwordError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reset-confirm-password"
                  className="mb-1.5 block text-sm font-bold text-[#403832]"
                >
                  Confirm new password
                </label>
                <input
                  id="reset-confirm-password"
                  name="passwordConfirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  aria-invalid={Boolean(confirmError)}
                  aria-describedby={confirmError ? "reset-confirm-error" : undefined}
                  className={fieldClass}
                  placeholder="Re-enter new password"
                />
                {confirmError && (
                  <p id="reset-confirm-error" className="mt-1.5 text-xs font-semibold text-[#B8443C]">
                    {confirmError}
                  </p>
                )}
              </div>
            </>
          )}

          {requestError && (
            <div
              role="alert"
              className="rounded-[10px] border border-[#EBC7C3] bg-[#FCE9E7] px-3.5 py-3 text-sm font-semibold text-[#9B3933]"
            >
              {requestError}
            </div>
          )}

          {statusMessage && (
            <div
              role="status"
              className="rounded-[10px] border border-[#BFD9C5] bg-[#EDF8EF] px-3.5 py-3 text-sm font-semibold text-[#356344]"
            >
              {statusMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D9CEC4] bg-white px-4 text-sm font-bold text-[#6F655E] hover:bg-[#F6F0E8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#7A3E24] px-5 text-sm font-bold text-white transition hover:bg-[#934E2E] disabled:cursor-wait disabled:opacity-70"
            >
              {pending && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
              {pending
                ? "Submitting…"
                : mode === "request"
                ? "Send reset link"
                : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
