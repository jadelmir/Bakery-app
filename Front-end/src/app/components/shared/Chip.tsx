import React from "react";

export function Chip({ cfg }: { cfg: { label: string; textCls: string; bgCls: string } }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.textCls} ${cfg.bgCls}`}>
      {cfg.label}
    </span>
  );
}
