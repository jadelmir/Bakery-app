import { type FormEvent, useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle, MailPlus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import type {
  BakeryInvitation,
  BakeryMembership,
  BakeryRole,
  TeamMember,
  WorkspaceAdapter,
} from "./workspace";
import { DeleteBakeryDialog } from "./DeleteBakeryDialog";

interface TeamManagementProps {
  membership: BakeryMembership;
  adapter: WorkspaceAdapter;
  onDeleteBakery?: () => void;
}

export function TeamManagement({ membership, adapter, onDeleteBakery }: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<BakeryInvitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BakeryRole>("staff");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const canManage = membership.role === "owner" || membership.role === "manager";
  const allowedInviteRoles: BakeryRole[] = membership.role === "owner"
    ? ["owner", "manager", "staff"]
    : ["staff"];

  const load = async () => {
    const [nextMembers, nextInvitations] = await Promise.all([
      adapter.listTeam(membership.bakeryId),
      canManage ? adapter.listInvitations(membership.bakeryId) : Promise.resolve([]),
    ]);
    setMembers(nextMembers);
    setInvitations(nextInvitations);
  };

  useEffect(() => {
    setError("");
    void load().catch(reason => setError(reason instanceof Error ? reason.message : "Could not load the team."));
  }, [membership.bakeryId]);

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      await adapter.inviteMember(membership.bakeryId, email.trim(), role);
      setEmail("");
      setMessage(`Invitation sent to ${email.trim()}.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send the invitation.");
    } finally {
      setPending(false);
    }
  };

  const runAction = async (action: () => Promise<void>, success: string) => {
    setPending(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The team action failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 pb-24 sm:p-7">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#7A3E24]">{membership.bakeryName}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#2F2925]">Team access</h1>
        <p className="mt-2 text-sm text-[#6F655E]">Members and invitations apply only to this bakery.</p>
      </div>

      {message && <p role="status" className="mb-4 rounded-xl border border-[#BFD9C5] bg-[#EDF8EF] p-3 text-sm font-semibold text-[#356344]">{message}</p>}
      {error && <p role="alert" className="mb-4 rounded-xl border border-[#EBC7C3] bg-[#FCE9E7] p-3 text-sm font-semibold text-[#9B3933]">{error}</p>}

      {canManage && (
        <form onSubmit={invite} className="mb-7 rounded-2xl border border-[#E5DDD3] bg-white p-5">
          <div className="flex items-center gap-3">
            <MailPlus size={21} className="text-[#7A3E24]" aria-hidden="true" />
            <h2 className="font-extrabold text-[#2F2925]">Invite someone</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]">
            <label className="sr-only" htmlFor="invite-email">Email address</label>
            <input id="invite-email" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="person@example.com" className="h-11 rounded-xl border border-[#D9CEC4] px-3" />
            <label className="sr-only" htmlFor="invite-role">Role</label>
            <select id="invite-role" value={role} onChange={event => setRole(event.target.value as BakeryRole)} className="h-11 rounded-xl border border-[#D9CEC4] px-3 capitalize">
              {allowedInviteRoles.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
            <button type="submit" disabled={pending} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A3E24] px-5 font-bold text-white disabled:opacity-60">
              {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              Invite
            </button>
          </div>
        </form>
      )}

      <section className="rounded-2xl border border-[#E5DDD3] bg-white">
        <div className="border-b border-[#EEE7DF] p-5">
          <h2 className="font-extrabold text-[#2F2925]">Members</h2>
        </div>
        <ul className="divide-y divide-[#EEE7DF]">
          {members.map(member => {
            const managerCanAct = membership.role === "manager" && member.role === "staff";
            const ownerCanAct = membership.role === "owner" && member.id !== membership.id;
            const canAct = ownerCanAct || managerCanAct;
            return (
              <li key={member.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5EEE8] text-[#7A3E24]"><UserRound size={18} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-[#2F2925]">{member.fullName || member.email}</span>
                  <span className="block truncate text-xs text-[#7C7068]">{member.email}</span>
                </span>
                {canAct && membership.role === "owner" ? (
                  <select
                    aria-label={`Role for ${member.email}`}
                    value={member.role}
                    disabled={pending}
                    onChange={event => void runAction(
                      () => adapter.updateMemberRole(member.id, event.target.value as BakeryRole),
                      "Member role updated.",
                    )}
                    className="h-9 rounded-lg border border-[#D9CEC4] px-2 text-sm capitalize"
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5EEE8] px-2.5 py-1 text-xs font-bold capitalize text-[#6B4A38]">
                    <ShieldCheck size={13} aria-hidden="true" />{member.role}
                  </span>
                )}
                {canAct && (
                  <>
                    {membership.role === "owner" && member.id !== membership.id && member.role !== "owner" && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm(`Transfer ownership to ${member.email}? You will become a Manager.`)) {
                            void runAction(() => adapter.transferOwnership(member.id), "Ownership transferred.");
                          }
                        }}
                        className="text-xs font-bold text-[#7A3E24]"
                      >
                        Transfer ownership
                      </button>
                    )}
                    <button type="button" disabled={pending} aria-label={`Remove ${member.email}`} onClick={() => void runAction(() => adapter.removeMember(member.id), "Member removed.")} className="rounded-lg p-2 text-[#A43F37] hover:bg-[#FCE9E7]">
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {canManage && invitations.length > 0 && (
        <section className="mt-6 rounded-2xl border border-[#E5DDD3] bg-white">
          <div className="border-b border-[#EEE7DF] p-5"><h2 className="font-extrabold text-[#2F2925]">Pending invitations</h2></div>
          <ul className="divide-y divide-[#EEE7DF]">
            {invitations.map(invitation => (
              <li key={invitation.id} className="flex items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-[#2F2925]">{invitation.email}</span>
                  <span className="text-xs capitalize text-[#7C7068]">{invitation.role} · pending</span>
                </span>
                <button type="button" disabled={pending} onClick={() => void runAction(() => adapter.revokeInvitation(invitation.id), "Invitation revoked.")} className="text-sm font-bold text-[#A43F37]">Revoke</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {membership.role === "owner" && (
        <section className="mt-8 rounded-2xl border border-[#F5C2C0] bg-[#FDF4F3] p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-[#B8443C]" aria-hidden="true" />
            <h2 className="font-extrabold text-[#B8443C]">Danger Zone</h2>
          </div>
          <p className="mt-1.5 text-xs text-[#6F655E] leading-relaxed">
            Permanently delete <strong className="text-[#2F2925]">{membership.bakeryName}</strong>, including all recipes, orders, inventory logs, and customer billing.
          </p>
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#B8443C] px-4 text-xs font-bold text-white hover:bg-[#9E3932] transition-colors"
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete Bakery Store
          </button>
        </section>
      )}

      <DeleteBakeryDialog
        isOpen={deleteDialogOpen}
        bakeryName={membership.bakeryName}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          await adapter.deleteBakery(membership.bakeryId);
          onDeleteBakery?.();
        }}
      />
    </div>
  );
}
