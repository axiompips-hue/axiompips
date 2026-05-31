// File: src/components/feedback/StarRating.tsx
"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  onHoverChange?: (value: number | null) => void;
  maxStars?: number;
  size?: "small" | "default" | "large";
  disabled?: boolean;
}

export function StarRating({
  value,
  onChange,
  onHoverChange,
  maxStars = 5,
  size = "default",
  disabled = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    small: "w-5 h-5",
    default: "w-7 h-7",
    large: "w-9 h-9",
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleMouseEnter = (starValue: number) => {
    if (disabled) return;
    setHoverValue(starValue);
    if (onHoverChange) {
      onHoverChange(starValue);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
    if (onHoverChange) {
      onHoverChange(null);
    }
  };

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: maxStars }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayValue;

        return (
          <button
            key={index}
            type="button"
            onClick={() => !disabled && onChange(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            className={`
              ${sizeClasses[size]}
              transition-all duration-150 transform
              ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"}
              ${isFilled ? "text-yellow-400" : "text-zinc-600"}
            `}
            role="radio"
            aria-checked={starValue === value}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill={isFilled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={isFilled ? 0 : 1.5}
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export function getRatingLabel(rating: number): string {
  switch (rating) {
    case 1:
      return "Poor";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Very Good";
    case 5:
      return "Excellent";
    default:
      return "";
  }
}