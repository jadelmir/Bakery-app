import React from "react";

export function SectionHeader({ title, action, actionLabel }: { title: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-bold text-[#2F2925] text-base">{title}</h2>
      {action && actionLabel && (
        <button onClick={action} className="text-xs text-[#B4643B] font-semibold">{actionLabel}</button>
      )}
    </div>
  );
}
