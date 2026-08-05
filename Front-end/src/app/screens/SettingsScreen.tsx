import { TeamManagement } from "../TeamManagement";
import type { BakeryMembership, WorkspaceAdapter } from "../workspace";

export function SettingsScreen({ membership, adapter, onDeleteBakery }: { membership?: BakeryMembership; adapter?: WorkspaceAdapter; onDeleteBakery?: () => void }) {
  if (membership && adapter) {
    return <TeamManagement membership={membership} adapter={adapter} onDeleteBakery={onDeleteBakery} />;
  }
  return <div className="px-4 py-6 max-w-2xl mx-auto pb-28 lg:pb-10"><h1 className="text-xl font-extrabold text-[#2F2925] mb-5">Settings</h1></div>;
}
