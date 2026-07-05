"use client";

/**
 * SilexSwitch — premium toggle switch matching the SILEX design system.
 *
 * Spec:
 *   Track  44×24px · fully rounded
 *   OFF    bg #27272A  thumb #FAFAFA
 *   ON     bg #6366F1  thumb #FFFFFF  glow rgba(99,102,241,0.25)
 *   Thumb  18×18px · perfectly centred (3px inset each side)
 *   Motion 200ms ease-in-out
 *   A11y   role="switch" · aria-checked · keyboard Space/Enter
 */

import React, { useId } from "react";

interface SilexSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export const SilexSwitch: React.FC<SilexSwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  id: externalId,
}) => {
  const autoId = useId();
  const switchId = externalId ?? autoId;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onCheckedChange(!checked);
    }
  };

  return (
    <button
      id={switchId}
      role="switch"
      type="button"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      onKeyDown={handleKeyDown}
      className={[
        // Layout
        "relative inline-flex shrink-0 cursor-pointer select-none",
        "items-center rounded-full",
        // Size — track
        "h-6 w-11",
        // Transition
        "transition-all duration-200 ease-in-out",
        // Focus ring — visible on keyboard nav, hidden on mouse click
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Disabled
        disabled ? "opacity-40 cursor-not-allowed" : "hover:brightness-110",
      ].join(" ")}
      style={{
        backgroundColor: checked ? "#6366F1" : "#27272A",
        boxShadow: checked ? "0 0 12px rgba(99,102,241,0.25)" : "none",
      }}
    >
      {/* Thumb */}
      <span
        aria-hidden="true"
        className="pointer-events-none block rounded-full transition-transform duration-200 ease-in-out"
        style={{
          width: "18px",
          height: "18px",
          backgroundColor: checked ? "#FFFFFF" : "#FAFAFA",
          transform: checked ? "translateX(20px)" : "translateX(3px)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
};

/**
 * SettingsToggleRow — full row with label + description + SilexSwitch.
 * Used in Notifications and Security tabs.
 */
interface SettingsToggleRowProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
  last?: boolean;
}

export const SettingsToggleRow: React.FC<SettingsToggleRowProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  last = false,
}) => {
  const id = useId();

  return (
    <div
      className={[
        "flex items-center justify-between gap-6 py-4",
        last ? "" : "border-b border-border-custom",
      ].join(" ")}
    >
      {/* Text */}
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-foreground cursor-pointer select-none"
        >
          {label}
        </label>
        <p className="mt-0.5 text-2xs text-muted-custom leading-relaxed">
          {description}
        </p>
      </div>

      {/* Switch */}
      <SilexSwitch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        label={label}
        disabled={disabled}
      />
    </div>
  );
};
