import React, { useState, useEffect } from "react";
import { Calendar, Clock, AlertTriangle, Check } from "lucide-react";
import type { DomainPickupWindow, DomainClosedDate } from "../../domain/types";

export interface FulfillmentDatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:MM or window name/time string
  onChangeDate: (date: string) => void;
  onChangeTime: (time: string) => void;
  pickupWindows?: readonly DomainPickupWindow[];
  closedDates?: readonly DomainClosedDate[];
  minimumLeadTimeHours?: number;
  validateCheckout?: (
    date: string,
    time?: string
  ) => Promise<{ valid: boolean; reason?: string; code?: string }> | { valid: boolean; reason?: string; code?: string };
}

export function FulfillmentDatePicker({
  selectedDate,
  selectedTime,
  onChangeDate,
  onChangeTime,
  pickupWindows = [],
  closedDates = [],
  minimumLeadTimeHours = 24,
  validateCheckout,
}: FulfillmentDatePickerProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  // Compute minimum date based on lead time
  const minDateString = (() => {
    const now = new Date();
    if (minimumLeadTimeHours > 0) {
      now.setHours(now.getHours() + minimumLeadTimeHours);
    }
    return now.toISOString().split("T")[0];
  })();

  useEffect(() => {
    let active = true;

    async function checkValidation() {
      if (!selectedDate) {
        setValidationError("Please select a fulfillment date.");
        return;
      }

      // Quick local client checks
      const isClosed = closedDates.some((cd) => cd.date === selectedDate);
      if (isClosed) {
        const closedInfo = closedDates.find((cd) => cd.date === selectedDate);
        if (active) {
          setValidationError(
            `Store is closed on ${selectedDate}${closedInfo?.reason ? ` (${closedInfo.reason})` : ""}.`
          );
        }
        return;
      }

      if (minimumLeadTimeHours > 0) {
        const now = new Date();
        const timeStr = selectedTime ? (selectedTime.includes(":") ? selectedTime.split(" - ")[0] : "12:00") : "12:00";
        const target = new Date(`${selectedDate}T${timeStr}:00`);
        const diffHours = (target.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours < minimumLeadTimeHours) {
          if (active) {
            setValidationError(
              `Orders require at least ${minimumLeadTimeHours} hours lead time.`
            );
          }
          return;
        }
      }

      if (validateCheckout) {
        const res = await validateCheckout(selectedDate, selectedTime);
        if (active) {
          if (!res.valid) {
            setValidationError(res.reason ?? "Selected date is unavailable.");
          } else {
            setValidationError(null);
          }
        }
      } else if (active) {
        setValidationError(null);
      }
    }

    void checkValidation();

    return () => {
      active = false;
    };
  }, [selectedDate, selectedTime, closedDates, minimumLeadTimeHours, validateCheckout]);

  const enabledPickupWindows = pickupWindows.filter((pw) => pw.isEnabled);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="fulfillment-date-input" className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1.5">
          Fulfillment Date
        </label>
        <div className="relative">
          <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84]" />
          <input
            id="fulfillment-date-input"
            type="date"
            min={minDateString}
            value={selectedDate}
            onChange={(e) => onChangeDate(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] font-medium focus:outline-none focus:border-[#7A3E24] transition-colors"
          />
        </div>
        {minimumLeadTimeHours > 0 && (
          <p className="text-[11px] text-[#988D84] mt-1">
            * Requires minimum {minimumLeadTimeHours}h lead time
          </p>
        )}
      </div>

      <div>
        <label htmlFor="fulfillment-time-select" className="block text-xs font-bold text-[#6F655E] uppercase tracking-wider mb-1.5">
          Fulfillment Time / Window
        </label>
        {enabledPickupWindows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {enabledPickupWindows.map((pw) => {
              const windowLabel = `${pw.startTime} - ${pw.endTime}`;
              const isSelected = selectedTime === windowLabel || selectedTime === pw.name;
              return (
                <button
                  key={pw.id}
                  type="button"
                  onClick={() => onChangeTime(windowLabel)}
                  className={`flex items-center justify-between p-3 rounded-[10px] border text-left transition-all ${
                    isSelected
                      ? "border-[#7A3E24] bg-[#FAF1EB] text-[#7A3E24] font-bold shadow-sm"
                      : "border-[#E5DDD3] bg-white text-[#6F655E] hover:bg-[#F6F0E8]"
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#2F2925]">{pw.name}</p>
                    <p className="text-[11px] text-[#988D84]">
                      {pw.startTime} – {pw.endTime}
                    </p>
                  </div>
                  {isSelected && <Check size={16} className="text-[#7A3E24]" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="relative">
            <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#988D84]" />
            <input
              id="fulfillment-time-select"
              type="time"
              value={selectedTime}
              onChange={(e) => onChangeTime(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-[#E5DDD3] rounded-[10px] text-sm text-[#2F2925] focus:outline-none focus:border-[#7A3E24] transition-colors"
            />
          </div>
        )}
      </div>

      {validationError && (
        <div className="p-3 bg-[#FCE9E7] border border-[#B8443C]/30 rounded-[10px] flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-[#B8443C] flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-[#B8443C]">{validationError}</p>
        </div>
      )}
    </div>
  );
}
