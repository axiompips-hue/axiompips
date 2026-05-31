// File: src/components/ui/Input.tsx
"use client";

import {
  InputHTMLAttributes,
  forwardRef,
  useId,
} from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  suffix?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helper,
      suffix,
      prefix,
      className = "",
      id,
      type = "text",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          {label}
        </label>
        <div className="relative">
          {prefix && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-zinc-500 text-sm">{prefix}</span>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`
              w-full px-3 py-2.5 
              bg-neutral-900 
              border rounded-lg 
              text-zinc-100 
              placeholder-zinc-500
              transition-colors duration-150
              focus:outline-none focus:ring-1
              ${prefix ? "pl-10" : ""}
              ${suffix ? "pr-16" : ""}
              ${
                hasError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-zinc-700 focus:border-accent-500 focus:ring-accent-500"
              }
              ${className}
            `}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-zinc-500 text-sm">{suffix}</span>
            </div>
          )}
        </div>
        {hasError && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-400">
            {error}
          </p>
        )}
        {!hasError && helper && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-zinc-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";