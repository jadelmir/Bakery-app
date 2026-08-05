import { useState } from "react";
import { CheckCircle2, LoaderCircle, Mail, XCircle } from "lucide-react";
import type { WorkspaceAdapter } from "./workspace";

interface InvitationLandingProps {
  token: string;
  adapter: WorkspaceAdapter;
  userEmail: string;
  onAccepted: () => Promise<void>;
  onFinished: () => void;
}

export function InvitationLanding({
  token,
  adapter,
  userEmail,
  onAccepted,
  onFinished,
}: InvitationLandingProps) {
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const accept = async () => {
    setPending("accept");
    setError("");
    try {
      await adapter.acceptInvitation(token);
      setSuccess("Invitation accepted. This bakery is now available to you.");
      await onAccepted();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The invitation could not be accepted.");
    } finally {
      setPending(null);
    }
  };

  const decline = async () => {
    setPending("decline");
    setError("");
    try {
      await adapter.declineInvitation(token);
      setSuccess("Invitation declined.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The invitation could not be declined.");
    } finally {
      setPending(null);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBF8F3] px-4 py-8">
      <section className="w-full max-w-lg rounded-[22px] border border-[#E5DDD3] bg-white p-6 shadow-[0_18px_55px_rgba(73,47,32,0.08)] sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EEE8] text-[#7A3E24]">
          <Mail size={22} aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#7A3E24]">Bakery invitation</p>
        <h1 className="mt-2 text-2xl font-extrabold text-[#2F2925]">Join this store?</h1>
        <p className="mt-2 text-sm leading-6 text-[#6F655E]">
          You&apos;re signed in as <strong>{userEmail}</strong>. For security, this must match the invited address.
        </p>

        {error && <p role="alert" className="mt-5 rounded-xl border border-[#EBC7C3] bg-[#FCE9E7] p-3 text-sm font-semibold text-[#9B3933]"><XCircle className="mr-2 inline" size={17} aria-hidden="true" />{error}</p>}
        {success && <p role="status" className="mt-5 rounded-xl border border-[#BFD9C5] bg-[#EDF8EF] p-3 text-sm font-semibold text-[#356344]"><CheckCircle2 className="mr-2 inline" size={17} aria-hidden="true" />{success}</p>}

        {success ? (
          <button type="button" onClick={onFinished} className="mt-6 h-11 rounded-xl bg-[#7A3E24] px-6 font-bold text-white">
            Continue
          </button>
        ) : (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <button type="button" disabled={pending !== null} onClick={() => void decline()} className="h-11 rounded-xl border border-[#D9CEC4] px-5 font-bold text-[#6F655E] disabled:opacity-60">
              {pending === "decline" ? "Declining…" : "Decline"}
            </button>
            <button type="button" disabled={pending !== null} onClick={() => void accept()} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A3E24] px-6 font-bold text-white disabled:opacity-60">
              {pending === "accept" && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              {pending === "accept" ? "Accepting…" : "Accept invitation"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
