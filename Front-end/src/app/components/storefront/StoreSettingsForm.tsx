import React, { useState } from "react";
import { X, Store, Clock, Calendar, Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import type {
  DomainStorefront,
  DomainPickupWindow,
  DomainClosedDate,
  UpdateStorefrontSettingsInput,
} from "../../domain/types";

export interface StoreSettingsFormProps {
  isOpen: boolean;
  onClose: () => void;
  storefront?: DomainStorefront;
  pickupWindows?: readonly DomainPickupWindow[];
  closedDates?: readonly DomainClosedDate[];
  onSaveSettings: (input: UpdateStorefrontSettingsInput) => Promise<void>;
}

export function StoreSettingsForm({
  isOpen,
  onClose,
  storefront,
  pickupWindows = [],
  closedDates = [],
  onSaveSettings,
}: StoreSettingsFormProps) {
  const [name, setName] = useState(storefront?.name ?? "Earl's Bakery");
  const [slug, setSlug] = useState(storefront?.slug ?? "earls-bakery");
  const [description, setDescription] = useState(storefront?.description ?? "");
  const [isEnabled, setIsEnabled] = useState(storefront?.isEnabled ?? true);

  const [leadTimeHours, setLeadTimeHours] = useState(
    storefront?.capacityRules.minimumLeadTimeHours ?? 24
  );
  const [cutoffTime, setCutoffTime] = useState(
    storefront?.capacityRules.orderCutoffTime ?? "18:00"
  );
  const [maxDailyOrders, setMaxDailyOrders] = useState(
    storefront?.capacityRules.maximumDailyOrders ?? 15
  );

  const [windows, setWindows] = useState<DomainPickupWindow[]>(
    pickupWindows.length > 0
      ? [...pickupWindows]
      : [
          {
            id: `pw-1`,
            storefrontId: storefront?.id ?? "sf-earls",
            name: "Morning Pickup",
            startTime: "09:00",
            endTime: "12:00",
            maxCapacity: 10,
            isEnabled: true,
          },
          {
            id: `pw-2`,
            storefrontId: storefront?.id ?? "sf-earls",
            name: "Afternoon Pickup",
            startTime: "13:00",
            endTime: "17:00",
            maxCapacity: 10,
            isEnabled: true,
          },
        ]
  );

  const [closed, setClosed] = useState<DomainClosedDate[]>([...closedDates]);
  const [newClosedDate, setNewClosedDate] = useState("");
  const [newClosedReason, setNewClosedReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddWindow = () => {
    const newWin: DomainPickupWindow = {
      id: `pw-${Date.now()}`,
      storefrontId: storefront?.id ?? "sf-earls",
      name: "Custom Window",
      startTime: "10:00",
      endTime: "14:00",
      maxCapacity: 10,
      isEnabled: true,
    };
    setWindows([...windows, newWin]);
  };

  const handleRemoveWindow = (id: string) => {
    setWindows(windows.filter((w) => w.id !== id));
  };

  const handleToggleWindow = (id: string) => {
    setWindows(
      windows.map((w) => (w.id === id ? { ...w, isEnabled: !w.isEnabled } : w))
    );
  };

  const handleAddClosedDate = () => {
    if (!newClosedDate) return;
    const cd: DomainClosedDate = {
      id: `cd-${Date.now()}`,
      storefrontId: storefront?.id ?? "sf-earls",
      date: newClosedDate,
      reason: newClosedReason.trim() || undefined,
    };
    setClosed([...closed, cd]);
    setNewClosedDate("");
    setNewClosedReason("");
  };

  const handleRemoveClosedDate = (id: string) => {
    setClosed(closed.filter((c) => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Storefront name is required.");
      return;
    }
    if (!slug.trim()) {
      setError("Storefront slug is required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSaveSettings({
        bakeryId: storefront?.bakeryId ?? "bakery-north",
        operationId: `update-storefront-${Date.now()}`,
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: description.trim() || undefined,
        isEnabled,
        capacityRules: {
          minimumLeadTimeHours: Number(leadTimeHours),
          orderCutoffTime: cutoffTime,
          maximumDailyOrders: Number(maxDailyOrders),
        },
        pickupWindows: windows,
        closedDates: closed,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update storefront settings.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-[20px] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5DDD3] bg-[#FBF8F3] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#7A3E24] text-white flex items-center justify-center">
              <Store size={16} />
            </div>
            <h2 className="font-extrabold text-xl text-[#2F2925]">Online Store Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#988D84] hover:bg-[#F6F0E8] hover:text-[#2F2925] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Enable Toggle */}
          <div className="bg-[#FAF1EB] rounded-[14px] p-4 border border-[#E5DDD3] flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-[#2F2925]">Storefront Status</p>
              <p className="text-xs text-[#6F655E]">Enable or disable public checkout at /store/{slug}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                isEnabled ? "bg-[#3F7A55] text-white" : "bg-[#B8443C] text-white"
              }`}
            >
              {isEnabled ? "Online (Active)" : "Offline (Disabled)"}
            </button>
          </div>

          {/* General Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#7A3E24] uppercase tracking-wider">
              General Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                  Storefront Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                  URL Slug *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#988D84]">
                    /store/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full h-11 pl-18 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm font-mono text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                Storefront Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Artisanal sourdough, pastries, and fresh baked goods in Mill Valley."
                className="w-full p-3 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
              />
            </div>
          </div>

          {/* Lead Time & Capacity Rules */}
          <div className="space-y-4 pt-2 border-t border-[#F0E9E0]">
            <h3 className="text-xs font-bold text-[#7A3E24] uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} /> Capacity & Lead Time Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                  Min Lead Time (Hours)
                </label>
                <input
                  type="number"
                  min={0}
                  value={leadTimeHours}
                  onChange={(e) => setLeadTimeHours(Number(e.target.value))}
                  className="w-full h-11 px-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                  Order Cutoff Time
                </label>
                <input
                  type="time"
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1">
                  Max Daily Orders
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxDailyOrders}
                  onChange={(e) => setMaxDailyOrders(Number(e.target.value))}
                  className="w-full h-11 px-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#7A3E24]"
                />
              </div>
            </div>
          </div>

          {/* Pickup Windows */}
          <div className="space-y-3 pt-2 border-t border-[#F0E9E0]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#7A3E24] uppercase tracking-wider">
                Pickup Windows
              </h3>
              <button
                type="button"
                onClick={handleAddWindow}
                className="text-xs font-bold text-[#7A3E24] hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Window
              </button>
            </div>

            <div className="space-y-2">
              {windows.map((pw, idx) => (
                <div
                  key={pw.id}
                  className="p-3 bg-[#FBF8F3] rounded-[12px] border border-[#E5DDD3] flex items-center justify-between gap-3"
                >
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={pw.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWindows(windows.map((w) => (w.id === pw.id ? { ...w, name: val } : w)));
                      }}
                      className="h-9 px-3 border border-[#E5DDD3] rounded-[8px] text-xs font-bold text-[#2F2925]"
                    />
                    <input
                      type="time"
                      value={pw.startTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWindows(windows.map((w) => (w.id === pw.id ? { ...w, startTime: val } : w)));
                      }}
                      className="h-9 px-2 border border-[#E5DDD3] rounded-[8px] text-xs"
                    />
                    <input
                      type="time"
                      value={pw.endTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWindows(windows.map((w) => (w.id === pw.id ? { ...w, endTime: val } : w)));
                      }}
                      className="h-9 px-2 border border-[#E5DDD3] rounded-[8px] text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleWindow(pw.id)}
                    className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold ${
                      pw.isEnabled ? "bg-[#E8F3EB] text-[#3F7A55]" : "bg-[#F6F0E8] text-[#988D84]"
                    }`}
                  >
                    {pw.isEnabled ? "Active" : "Off"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveWindow(pw.id)}
                    className="text-[#988D84] hover:text-[#B8443C] p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Closed Dates */}
          <div className="space-y-3 pt-2 border-t border-[#F0E9E0]">
            <h3 className="text-xs font-bold text-[#7A3E24] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} /> Closed Holiday Dates
            </h3>

            <div className="flex gap-2">
              <input
                type="date"
                value={newClosedDate}
                onChange={(e) => setNewClosedDate(e.target.value)}
                className="h-10 px-3 border border-[#E5DDD3] rounded-[8px] text-xs"
              />
              <input
                type="text"
                value={newClosedReason}
                onChange={(e) => setNewClosedReason(e.target.value)}
                placeholder="Reason (e.g. Christmas)"
                className="flex-1 h-10 px-3 border border-[#E5DDD3] rounded-[8px] text-xs"
              />
              <button
                type="button"
                onClick={handleAddClosedDate}
                className="h-10 px-3 bg-[#7A3E24] text-white rounded-[8px] text-xs font-bold hover:bg-[#934E2E]"
              >
                Add
              </button>
            </div>

            <div className="space-y-1.5">
              {closed.map((cd) => (
                <div
                  key={cd.id}
                  className="px-3 py-2 bg-[#FCE9E7] border border-[#B8443C]/20 rounded-[8px] flex items-center justify-between text-xs text-[#B8443C]"
                >
                  <span>
                    <strong className="font-mono">{cd.date}</strong>
                    {cd.reason ? ` — ${cd.reason}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveClosedDate(cd.id)}
                    className="text-[#B8443C] hover:opacity-75"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[#FCE9E7] border border-[#B8443C]/30 rounded-[10px] flex items-center gap-2">
              <AlertTriangle size={16} className="text-[#B8443C] flex-shrink-0" />
              <p className="text-xs font-semibold text-[#B8443C]">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-[12px] border border-[#E5DDD3] text-[#6F655E] font-semibold text-sm hover:bg-[#F6F0E8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-12 rounded-[12px] bg-[#7A3E24] hover:bg-[#934E2E] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-md"
            >
              {submitting ? "Saving..." : "Save Storefront Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
