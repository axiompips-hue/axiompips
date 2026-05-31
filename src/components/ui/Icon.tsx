// File: src/components/ui/Icon.tsx
import { ReactNode } from "react";

interface IconProps {
  children: ReactNode;
  label?: string;
  className?: string;
  size?: "small" | "default" | "large";
}

/**
 * Accessible icon wrapper.
 * If label is provided, it's announced to screen readers.
 * If no label, icon is hidden from screen readers.
 */
export function Icon({
  children,
  label,
  className = "",
  size = "default",
}: IconProps) {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-5 h-5",
    large: "w-6 h-6",
  };

  if (label) {
    return (
      <span className={`inline-flex ${sizeClasses[size]} ${className}`} role="img" aria-label={label}>
        {children}
      </span>
    );
  }

  return (
    <span className={`inline-flex ${sizeClasses[size]} ${className}`} aria-hidden="true">
      {children}
    </span>
  );
}