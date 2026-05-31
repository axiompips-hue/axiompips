// File: src/components/ui/Select.tsx
"use client";

import {
  SelectHTMLAttributes,
  forwardRef,
  useId,
} from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  helper?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      helper,
      placeholder,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full px-3 py-2.5 
              bg-neutral-900 
              border rounded-lg 
              text-zinc-100
              appearance-none
              cursor-pointer
              transition-colors duration-150
              focus:outline-none focus:ring-1
              ${
                hasError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-zinc-700 focus:border-accent-500 focus:ring-accent-500"
              }
              ${className}
            `}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${selectId}-error` : helper ? `${selectId}-helper` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {hasError && (
          <p id={`${selectId}-error`} className="mt-1.5 text-xs text-red-400">
            {error}
          </p>
        )}
        {!hasError && helper && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-xs text-zinc-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";