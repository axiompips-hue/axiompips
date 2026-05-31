// File: src/components/ui/Slider.tsx
"use client";

import { InputHTMLAttributes, forwardRef, useId } from "react";

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  showValue?: boolean;
  helper?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      value,
      min,
      max,
      step = 1,
      suffix,
      showValue = true,
      helper,
      className = "",
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const sliderId = id || generatedId;

    // Calculate percentage for styling
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor={sliderId}
            className="text-sm font-medium text-zinc-300"
          >
            {label}
          </label>
          {showValue && (
            <span className="text-sm font-mono text-accent-400">
              {value}
              {suffix && <span className="text-zinc-500 ml-0.5">{suffix}</span>}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            ref={ref}
            id={sliderId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className={`
              w-full h-2 rounded-lg appearance-none cursor-pointer
              bg-zinc-700
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-accent-500
              [&::-webkit-slider-thumb]:hover:bg-accent-400
              [&::-webkit-slider-thumb]:transition-colors
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-md
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-accent-500
              [&::-moz-range-thumb]:hover:bg-accent-400
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-neutral-950
              ${className}
            `}
            style={{
              background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${percentage}%, #3f3f46 ${percentage}%, #3f3f46 100%)`,
            }}
            {...props}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-zinc-500">{min}{suffix}</span>
          <span className="text-xs text-zinc-500">{max}{suffix}</span>
        </div>
        {helper && (
          <p className="mt-1.5 text-xs text-zinc-500">{helper}</p>
        )}
      </div>
    );
  }
);

Slider.displayName = "Slider";