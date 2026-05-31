// File: src/components/feedback/EmojiRating.tsx
"use client";

import { useState } from "react";

interface EmojiRatingProps {
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const emojis = [
  { value: "angry", label: "Very Dissatisfied", icon: "angry" },
  { value: "sad", label: "Dissatisfied", icon: "sad" },
  { value: "neutral", label: "Neutral", icon: "neutral" },
  { value: "happy", label: "Satisfied", icon: "happy" },
  { value: "love", label: "Very Satisfied", icon: "love" },
];

function EmojiIcon({ type, isActive }: { type: string; isActive: boolean }) {
  const baseClass = `w-8 h-8 transition-transform ${isActive ? "scale-110" : ""}`;
  
  switch (type) {
    case "angry":
      return (
        <svg className={baseClass} viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="16" fill={isActive ? "#FCD34D" : "#52525b"} />
          <path d="M10 14L14 12" stroke={isActive ? "#92400E" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" />
          <path d="M26 14L22 12" stroke={isActive ? "#92400E" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="2" fill={isActive ? "#92400E" : "#a1a1aa"} />
          <circle cx="24" cy="16" r="2" fill={isActive ? "#92400E" : "#a1a1aa"} />
          <path d="M12 26C12 26 15 22 18 22C21 22 24 26 24 26" stroke={isActive ? "#92400E" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "sad":
      return (
        <svg className={baseClass} viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="16" fill={isActive ? "#FCD34D" : "#52525b"} />
          <circle cx="12" cy="14" r="2" fill={isActive ? "#92400E" : "#a1a1aa"} />
          <circle cx="24" cy="14" r="2" fill={isActive ? "#92400E" : "#a1a1aa"} />
          <path d="M12 26C12 26 14 23 18 23C22 23 24 26 24 26" stroke={isActive ? "#92400E" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "neutral":
      return (
        <svg className={baseClass} viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="16" fill={isActive ? "#FCD34D" : "#52525b"} />
          <circle cx="12" cy="14" r="2" fill={isActive ? "#92400E" : "#a1a1aa"} />
          <circle cx="24" cy="14" r="2" fill={isActive ? "#92400E" : "#a1a1aa"} />
          <path d="M12 24H24" stroke={isActive ? "#92400E" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "happy":
      return (
        <svg className={baseClass} viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="16" fill={isActive ? "#FCD34D" : "#52525b"} />
          <circle cx="12" cy="14" r="2" fill={isActive ? "#92400E" : "#a1a1aa"} />
          <circle cx="24" cy="14" r="2" fill={isActive ? "#92400E" : "#a1a1aa"} />
          <path d="M12 22C12 22 14 26 18 26C22 26 24 22 24 22" stroke={isActive ? "#92400E" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "love":
      return (
        <svg className={baseClass} viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="16" fill={isActive ? "#FCD34D" : "#52525b"} />
          <path d="M9 14C9 12 10.5 10 13 10C15.5 10 16 12 16 14C16 16 13 19 13 19C13 19 10 16 9 14Z" fill={isActive ? "#EF4444" : "#a1a1aa"} />
          <path d="M20 14C20 12 21.5 10 24 10C26.5 10 27 12 27 14C27 16 24 19 24 19C24 19 21 16 20 14Z" fill={isActive ? "#EF4444" : "#a1a1aa"} />
          <path d="M12 24C12 24 14 28 18 28C22 28 24 24 24 24" stroke={isActive ? "#92400E" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function EmojiRating({ value, onChange, disabled = false }: EmojiRatingProps) {
  const [hoverValue, setHoverValue] = useState<string | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;
  const currentEmoji = emojis.find((e) => e.value === displayValue);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-center gap-2" role="radiogroup" aria-label="How do you feel?">
        {emojis.map((emoji) => {
          const isSelected = value === emoji.value;
          const isActive = displayValue === emoji.value;

          return (
            <button
              key={emoji.value}
              type="button"
              onClick={() => !disabled && onChange(emoji.value)}
              onMouseEnter={() => !disabled && setHoverValue(emoji.value)}
              onMouseLeave={() => setHoverValue(null)}
              disabled={disabled}
              className={`
                relative p-3 rounded-xl transition-all duration-200 transform
                ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"}
                ${
                  isSelected
                    ? "bg-accent-950/50 border-2 border-accent-500"
                    : isActive
                    ? "bg-zinc-800 border-2 border-zinc-600"
                    : "bg-zinc-800/50 border-2 border-transparent hover:bg-zinc-800"
                }
              `}
              role="radio"
              aria-checked={isSelected}
              aria-label={emoji.label}
              title={emoji.label}
            >
              <EmojiIcon type={emoji.icon} isActive={isActive} />
            </button>
          );
        })}
      </div>
      
      {/* Live label display */}
      <div className="h-6">
        {currentEmoji && (
          <span className="text-sm text-accent-400 animate-fade-in">
            {currentEmoji.label}
          </span>
        )}
      </div>
    </div>
  );
}

export function getEmojiLabel(value: string): string {
  const emoji = emojis.find((e) => e.value === value);
  return emoji ? emoji.label : "";
}