import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../lib/supabase/client";
import type { Database } from "../lib/supabase/database.types";

export type BakeryRole = "owner" | "manager" | "staff";

export interface BakeryMembership {
  id: string;
  bakeryId: string;
  bakeryName: string;
  role: BakeryRole;
  isDefault: boolean;
}

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: BakeryRole;
}

export interface BakeryInvitation {
  id: string;
  email: string;
  role: BakeryRole;
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  expiresAt: string;
}

export interface WorkspaceAdapter {
  listMemberships(userId: string): Promise<BakeryMembership[]>;
  createDefaultBakery(name: string): Promise<string>;
  createAdditionalBakery(name: string): Promise<string>;
  setDefaultBakery(bakeryId: string): Promise<void>;
  listTeam(bakeryId: string): Promise<TeamMember[]>;
  listInvitations(bakeryId: string): Promise<BakeryInvitation[]>;
  inviteMember(bakeryId: string, email: string, role: BakeryRole): Promise<void>;
  revokeInvitation(invitationId: string): Promise<void>;
  updateMemberRole(membershipId: string, role: BakeryRole): Promise<void>;
  removeMember(membershipId: string): Promise<void>;
  transferOwnership(membershipId: string): Promise<void>;
  deleteBakery(bakeryId: string): Promise<void>;
  acceptInvitation(token: string): Promise<string>;
  declineInvitation(token: string): Promise<void>;
}

type WorkspaceClient = SupabaseClient<Database>;

export function createSupabaseWorkspaceAdapter(
  client: WorkspaceClient = getSupabaseBrowserClient(),
): WorkspaceAdapter {
  return {
    async listMemberships(userId) {
      const [{ data: rows, error }, { data: profile, error: profileError }] = await Promise.all([
        client
          .from("bakery_memberships")
          .select("id,bakery_id,role,bakeries!inner(name)")
          .eq("user_id", userId)
          .order("created_at"),
        client.from("profiles").select("default_bakery_id").eq("id", userId).maybeSingle(),
      ]);
      if (error) throw new Error(error.message);
      if (profileError) throw new Error(profileError.message);
      return (rows ?? []).map(row => ({
        id: row.id,
        bakeryId: row.bakery_id,
        bakeryName: row.bakeries.name,
        role: row.role as BakeryRole,
        isDefault: profile?.default_bakery_id === row.bakery_id,
      }));
    },
    async createDefaultBakery(name) {
      const { data, error } = await client.rpc("create_default_bakery", {
        bakery_name: name,
      });
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Bakery creation did not return an ID.");
      return data;
    },
    async createAdditionalBakery(name) {
      const { data, error } = await client.rpc("create_additional_bakery", {
        bakery_name: name,
      });
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Bakery creation did not return an ID.");
      return data;
    },
    async setDefaultBakery(bakeryId) {
      const { error } = await client.rpc("set_default_bakery", {
        target_bakery_id: bakeryId,
      });
      if (error) throw new Error(error.message);
    },
    async deleteBakery(bakeryId) {
      const { error } = await client.from("bakeries").delete().eq("id", bakeryId);
      if (error) throw new Error(error.message);
    },
    async listTeam(bakeryId) {
      const { data: memberships, error } = await client
        .from("bakery_memberships")
        .select("id,user_id,role")
        .eq("bakery_id", bakeryId)
        .order("created_at");
      if (error) throw new Error(error.message);
      const userIds = (memberships ?? []).map(item => item.user_id);
      const { data: profiles, error: profilesError } = userIds.length
        ? await client.from("profiles").select("id,email,full_name").in("id", userIds)
        : { data: [], error: null };
      if (profilesError) throw new Error(profilesError.message);
      const profileById = new Map((profiles ?? []).map(profile => [profile.id, profile]));
      return (memberships ?? []).map(membership => {
        const profile = profileById.get(membership.user_id);
        return {
          id: membership.id,
          userId: membership.user_id,
          email: profile?.email ?? "Member",
          fullName: profile?.full_name ?? null,
          role: membership.role as BakeryRole,
        };
      });
    },
    async listInvitations(bakeryId) {
      const { data, error } = await client
        .from("bakery_invitations")
        .select("id,email,role,status,expires_at")
        .eq("bakery_id", bakeryId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role as BakeryRole,
        status: invitation.status as BakeryInvitation["status"],
        expiresAt: invitation.expires_at,
      }));
    },
    async inviteMember(bakeryId, email, role) {
      const { error } = await client.functions.invoke("send-bakery-invite", {
        body: { bakeryId, email, role },
      });
      if (error) throw new Error(error.message);
    },
    async revokeInvitation(invitationId) {
      const { error } = await client.rpc("revoke_bakery_invitation", {
        invitation_id: invitationId,
      });
      if (error) throw new Error(error.message);
    },
    async updateMemberRole(membershipId, role) {
      const { error } = await client.rpc("update_bakery_member_role", {
        membership_id: membershipId,
        new_role: role,
      });
      if (error) throw new Error(error.message);
    },
    async removeMember(membershipId) {
      const { error } = await client.rpc("remove_bakery_member", {
        membership_id: membershipId,
      });
      if (error) throw new Error(error.message);
    },
    async transferOwnership(membershipId) {
      const { error } = await client.rpc("transfer_bakery_ownership", {
        target_membership_id: membershipId,
      });
      if (error) throw new Error(error.message);
    },
    async acceptInvitation(token) {
      const { data, error } = await client.rpc("accept_bakery_invitation", {
        invitation_token: token,
      });
      if (error) throw new Error(error.message);
      const result = data as { status?: string; bakery_id?: string } | null;
      if (result?.status !== "accepted" || !result.bakery_id) {
        const messages: Record<string, string> = {
          email_unverified: "Verify your email address before accepting this invitation.",
          email_mismatch: "Sign in with the invited email address.",
          expired: "This invitation has expired.",
          invalid: "This invitation is invalid or has already been used.",
        };
        throw new Error(messages[result?.status ?? "invalid"]);
      }
      return result.bakery_id;
    },
    async declineInvitation(token) {
      const { data, error } = await client.rpc("decline_bakery_invitation", {
        invitation_token: token,
      });
      if (error) throw new Error(error.message);
      const result = data as { status?: string } | null;
      if (result?.status !== "declined") {
        const messages: Record<string, string> = {
          email_unverified: "Verify your email address before declining this invitation.",
          email_mismatch: "Sign in with the invited email address.",
          expired: "This invitation has expired.",
          invalid: "This invitation is invalid or has already been used.",
        };
        throw new Error(messages[result?.status ?? "invalid"]);
      }
    },
  };
}

export function createMockWorkspaceAdapter(
  initialMemberships: BakeryMembership[] = [{
    id: "membership-earls",
    bakeryId: "dev-bakery-earls",
    bakeryName: "J'adore Bakery",
    role: "owner",
    isDefault: true,
  }],
): WorkspaceAdapter {
  let memberships = [...initialMemberships];
  let nextBakeryNumber = 1;
  const team: TeamMember[] = [{
    id: "membership-earls",
    userId: "mock-owner",
    email: "owner@example.com",
    fullName: "Bakery Owner",
    role: "owner",
  }, {
    id: "membership-staff",
    userId: "mock-staff",
    email: "staff-member@example.com",
    fullName: "Bakery Staff",
    role: "staff",
  }];
  const invitations: BakeryInvitation[] = [];
  return {
    listMemberships: async () => memberships.map(item => ({ ...item })),
    createDefaultBakery: async name => {
      const existingMembership = memberships.find(item => item.isDefault) ?? memberships[0];
      if (existingMembership) return existingMembership.bakeryId;

      const bakeryId = `dev-bakery-${nextBakeryNumber++}`;
      const newMembership: BakeryMembership = {
        id: `membership-${nextBakeryNumber}`,
        bakeryId,
        bakeryName: name,
        role: "owner",
        isDefault: true,
      };
      memberships = [newMembership];
      return bakeryId;
    },
    createAdditionalBakery: async name => {
      const bakeryId = `dev-bakery-${nextBakeryNumber++}`;
      const newMembership: BakeryMembership = {
        id: `membership-${nextBakeryNumber}`,
        bakeryId,
        bakeryName: name,
        role: "owner",
        isDefault: false,
      };
      memberships = memberships.concat(newMembership);
      return bakeryId;
    },
    setDefaultBakery: async bakeryId => {
      memberships = memberships.map(item => ({ ...item, isDefault: item.bakeryId === bakeryId }));
    },
    listTeam: async () => team.map(item => ({ ...item })),
    listInvitations: async () => invitations.map(item => ({ ...item })),
    inviteMember: async (_bakeryId, email, role) => {
      if (invitations.some(item => item.email.toLowerCase() === email.trim().toLowerCase())) {
        throw new Error("A pending invitation already exists for this email.");
      }
      invitations.push({
        id: `invite-${invitations.length + 1}`,
        email: email.trim(),
        role,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      });
    },
    revokeInvitation: async invitationId => {
      const index = invitations.findIndex(item => item.id === invitationId);
      if (index >= 0) invitations.splice(index, 1);
    },
    updateMemberRole: async (membershipId, role) => {
      const member = team.find(item => item.id === membershipId);
      if (member) member.role = role;
    },
    removeMember: async membershipId => {
      const index = team.findIndex(item => item.id === membershipId);
      if (index >= 0) team.splice(index, 1);
    },
    transferOwnership: async membershipId => {
      const successor = team.find(item => item.id === membershipId);
      const owner = team.find(item => item.role === "owner");
      if (!successor || !owner || successor.id === owner.id) {
        throw new Error("Choose another member as the new owner.");
      }
      successor.role = "owner";
      owner.role = "manager";
    },
    deleteBakery: async bakeryId => {
      memberships = memberships.filter(item => item.bakeryId !== bakeryId);
      if (memberships.length > 0 && !memberships.some(item => item.isDefault)) {
        memberships[0].isDefault = true;
      }
    },
    acceptInvitation: async () => "dev-bakery-earls",
    declineInvitation: async () => undefined,
  };
}

export const supabaseWorkspaceAdapter: WorkspaceAdapter = {
  listMemberships: userId => createSupabaseWorkspaceAdapter().listMemberships(userId),
  createDefaultBakery: name => createSupabaseWorkspaceAdapter().createDefaultBakery(name),
  createAdditionalBakery: name => createSupabaseWorkspaceAdapter().createAdditionalBakery(name),
  setDefaultBakery: bakeryId => createSupabaseWorkspaceAdapter().setDefaultBakery(bakeryId),
  listTeam: bakeryId => createSupabaseWorkspaceAdapter().listTeam(bakeryId),
  listInvitations: bakeryId => createSupabaseWorkspaceAdapter().listInvitations(bakeryId),
  inviteMember: (bakeryId, email, role) => createSupabaseWorkspaceAdapter().inviteMember(bakeryId, email, role),
  revokeInvitation: id => createSupabaseWorkspaceAdapter().revokeInvitation(id),
  updateMemberRole: (id, role) => createSupabaseWorkspaceAdapter().updateMemberRole(id, role),
  removeMember: id => createSupabaseWorkspaceAdapter().removeMember(id),
  transferOwnership: id => createSupabaseWorkspaceAdapter().transferOwnership(id),
  deleteBakery: bakeryId => createSupabaseWorkspaceAdapter().deleteBakery(bakeryId),
  acceptInvitation: token => createSupabaseWorkspaceAdapter().acceptInvitation(token),
  declineInvitation: token => createSupabaseWorkspaceAdapter().declineInvitation(token),
};
