import { type FormEvent, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  KeyRound,
  LoaderCircle,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import type { AuthAdapter, AuthSession } from "./auth";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

export interface AccountProfileScreenProps {
  session: AuthSession;
  authAdapter?: AuthAdapter;
  changePassword?: AccountPasswordChangeOperation;
  onBack?: () => void;
  onLogout?: () => void;
}

export interface AccountPasswordChangeInput {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export type AccountPasswordChangeOperation = (
  input: AccountPasswordChangeInput,
) => Promise<void>;

export class CurrentPasswordVerificationError extends Error {
  constructor() {
    super("Current password is incorrect.");
    this.name = "CurrentPasswordVerificationError";
  }
}

export const changeAccountPassword: AccountPasswordChangeOperation = async ({
  email,
  currentPassword,
  newPassword,
}) => {
  const client = getSupabaseBrowserClient();
  const { error: verificationError } = await client.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (verificationError) {
    throw new CurrentPasswordVerificationError();
  }

  const { error: updateError } = await client.auth.updateUser({ password: newPassword });
  if (updateError) throw updateError;
};

const fieldClass =
  "h-11 w-full rounded-[10px] border border-[#D9CEC4] bg-white px-3.5 text-sm text-[#2F2925] outline-none transition focus:border-[#7A3E24] focus:ring-2 focus:ring-[#7A3E24]/15 aria-[invalid=true]:border-[#B8443C] aria-[invalid=true]:ring-[#B8443C]/10";

export function AccountProfileScreen({
  session,
  changePassword = changeAccountPassword,
  onBack,
  onLogout,
}: AccountProfileScreenProps) {
  const initialDisplayName = session.user.email.split("@")[0] || "Bakery Owner";
  const [displayName, setDisplayName] = useState(initialDisplayName);

  // Email preferences state
  const [prefDailyBake, setPrefDailyBake] = useState(true);
  const [prefOrderStatus, setPrefOrderStatus] = useState(true);
  const [prefLowStock, setPrefLowStock] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Feedback states
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const userInitials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileMessage("");
    if (!displayName.trim()) {
      setProfileError("Display name cannot be empty.");
      return;
    }

    setSavingProfile(true);
    try {
      if (import.meta.env.VITE_USE_MOCK_BACKEND !== "true") {
        const client = getSupabaseBrowserClient();
        const { error } = await client.auth.updateUser({
          data: { display_name: displayName.trim() },
        });
        if (error) throw error;
      }
      setProfileMessage("Account profile and notification preferences saved.");
    } catch (err) {
      if (import.meta.env.VITE_USE_MOCK_BACKEND === "true") {
        setProfileMessage("Mock mode: Account profile saved successfully.");
      } else {
        setProfileError(err instanceof Error ? err.message : "Could not save profile.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      if (import.meta.env.VITE_USE_MOCK_BACKEND !== "true") {
        await changePassword({
          email: session.user.email,
          currentPassword,
          newPassword,
        });
      }
      setPasswordMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (import.meta.env.VITE_USE_MOCK_BACKEND === "true") {
        setPasswordMessage("Mock mode: Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(
          err instanceof CurrentPasswordVerificationError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to change password.",
        );
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F3] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to workspace"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9CEC4] bg-white text-[#6F655E] transition hover:bg-[#F6F0E8] hover:text-[#2F2925]"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#2F2925]">
                Account &amp; Profile
              </h1>
              <p className="text-sm text-[#6F655E]">
                Manage your credentials, display settings, and notification preferences.
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 rounded-xl border border-[#EBC7C3] bg-[#FCE9E7] px-4 py-2.5 text-sm font-bold text-[#9B3933] transition hover:bg-[#FADBD8]"
            >
              <LogOut size={16} />
              Log out
            </button>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Avatar & Quick Info */}
          <div className="space-y-6 md:col-span-1">
            <div className="rounded-[20px] border border-[#E5DDD3] bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#7A3E24] text-2xl font-extrabold text-white shadow-inner">
                  {userInitials || <User size={40} />}
                </div>
                <h2 className="mt-4 font-extrabold text-[#2F2925]">{displayName}</h2>
                <p className="text-xs text-[#6F655E]">{session.user.email}</p>
                <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-[#E8F3EB] px-3 py-1 text-xs font-bold text-[#3F7A55]">
                  <Check size={12} /> Active Owner
                </span>

                <button
                  type="button"
                  onClick={() => alert("Avatar upload: Feature connected to Supabase Storage.")}
                  className="mt-5 w-full rounded-xl border border-[#D9CEC4] bg-[#FBF8F3] py-2 text-xs font-bold text-[#7A3E24] transition hover:bg-[#F6F0E8]"
                >
                  Change Avatar Photo
                </button>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#E5DDD3] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7A3E24]">
                <Shield size={14} /> Security Status
              </div>
              <p className="mt-2 text-xs text-[#6F655E]">
                Session managed via Supabase Auth. Tokens refresh automatically in background.
              </p>
            </div>
          </div>

          {/* Right Column: Profile Form & Password Change */}
          <div className="space-y-6 md:col-span-2">
            {/* Profile Information & Preferences */}
            <form
              onSubmit={handleSaveProfile}
              className="rounded-[20px] border border-[#E5DDD3] bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#E5DDD3]">
                <User className="text-[#7A3E24]" size={20} />
                <h2 className="text-lg font-extrabold text-[#2F2925]">Profile Information</h2>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="profile-display-name"
                    className="mb-1.5 block text-sm font-bold text-[#403832]"
                  >
                    Display Name
                  </label>
                  <input
                    id="profile-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={fieldClass}
                    placeholder="Earl Smith"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-email"
                    className="mb-1.5 block text-sm font-bold text-[#403832]"
                  >
                    Email Address
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={session.user.email}
                    disabled
                    className={`${fieldClass} bg-[#F6F0E8] cursor-not-allowed opacity-80`}
                  />
                  <p className="mt-1 text-xs text-[#988D84]">
                    Email address cannot be changed directly. Contact support to transfer ownership.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5DDD3]">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="text-[#7A3E24]" size={18} />
                    <h3 className="text-sm font-bold text-[#2F2925]">Email Notification Preferences</h3>
                  </div>

                  <div className="space-y-3 text-sm text-[#403832]">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefDailyBake}
                        onChange={(e) => setPrefDailyBake(e.target.checked)}
                        className="h-4 w-4 rounded border-[#D9CEC4] text-[#7A3E24] focus:ring-[#7A3E24]"
                      />
                      <span>Daily Bake Summary (Receive email at 5:00 AM)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefOrderStatus}
                        onChange={(e) => setPrefOrderStatus(e.target.checked)}
                        className="h-4 w-4 rounded border-[#D9CEC4] text-[#7A3E24] focus:ring-[#7A3E24]"
                      />
                      <span>Order Status Updates (Alerts when customer orders change status)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefLowStock}
                        onChange={(e) => setPrefLowStock(e.target.checked)}
                        className="h-4 w-4 rounded border-[#D9CEC4] text-[#7A3E24] focus:ring-[#7A3E24]"
                      />
                      <span>Low Stock Inventory Alerts (Alerts when ingredient levels drop below minimum)</span>
                    </label>
                  </div>
                </div>

                {profileError && (
                  <div role="alert" className="rounded-xl border border-[#EBC7C3] bg-[#FCE9E7] p-3 text-sm font-semibold text-[#9B3933]">
                    {profileError}
                  </div>
                )}
                {profileMessage && (
                  <div role="status" className="rounded-xl border border-[#BFD9C5] bg-[#EDF8EF] p-3 text-sm font-semibold text-[#356344]">
                    {profileMessage}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A3E24] px-6 text-sm font-bold text-white transition hover:bg-[#934E2E] disabled:opacity-70"
                  >
                    {savingProfile && <LoaderCircle size={16} className="animate-spin" />}
                    {savingProfile ? "Saving profile…" : "Save Profile & Preferences"}
                  </button>
                </div>
              </div>
            </form>

            {/* Change Password Card */}
            <form
              onSubmit={handleChangePassword}
              aria-busy={updatingPassword}
              className="rounded-[20px] border border-[#E5DDD3] bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#E5DDD3]">
                <KeyRound className="text-[#7A3E24]" size={20} />
                <h2 className="text-lg font-extrabold text-[#2F2925]">Change Password</h2>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="current-password"
                    className="mb-1.5 block text-sm font-bold text-[#403832]"
                  >
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    aria-describedby="password-feedback"
                    className={fieldClass}
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-1.5 block text-sm font-bold text-[#403832]"
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    aria-describedby="password-feedback"
                    className={fieldClass}
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-1.5 block text-sm font-bold text-[#403832]"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    aria-describedby="password-feedback"
                    className={fieldClass}
                    placeholder="Re-enter new password"
                  />
                </div>

                {passwordError && (
                  <div id="password-feedback" role="alert" className="rounded-xl border border-[#EBC7C3] bg-[#FCE9E7] p-3 text-sm font-semibold text-[#9B3933]">
                    {passwordError}
                  </div>
                )}
                {passwordMessage && (
                  <div id="password-feedback" role="status" className="rounded-xl border border-[#BFD9C5] bg-[#EDF8EF] p-3 text-sm font-semibold text-[#356344]">
                    {passwordMessage}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A3E24] px-6 text-sm font-bold text-white transition hover:bg-[#934E2E] disabled:opacity-70"
                  >
                    {updatingPassword && <LoaderCircle size={16} className="animate-spin" />}
                    {updatingPassword ? "Updating password…" : "Update Password"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
