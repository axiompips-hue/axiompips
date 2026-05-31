// File: src/components/feedback/FeedbackTypeSelector.tsx
"use client";

export type FeedbackType = "bug" | "feature" | "improvement" | "general" | "praise";

interface FeedbackTypeSelectorProps {
  value: FeedbackType | null;
  onChange: (value: FeedbackType) => void;
  onSelect?: (value: FeedbackType) => void;
}

const feedbackTypes = [
  {
    value: "bug" as FeedbackType,
    label: "Bug Report",
    description: "Something is not working",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: "red",
  },
  {
    value: "feature" as FeedbackType,
    label: "Feature Request",
    description: "Suggest a new feature",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: "purple",
  },
  {
    value: "improvement" as FeedbackType,
    label: "Improvement",
    description: "Make something better",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: "blue",
  },
  {
    value: "praise" as FeedbackType,
    label: "Praise",
    description: "Share what you love",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: "pink",
  },
  {
    value: "general" as FeedbackType,
    label: "General",
    description: "Other feedback",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: "zinc",
  },
];

const colorClasses = {
  red: {
    selected: "bg-red-950/50 border-red-500 text-red-400",
    hover: "hover:bg-red-950/30 hover:border-red-700",
    icon: "text-red-400",
  },
  purple: {
    selected: "bg-purple-950/50 border-purple-500 text-purple-400",
    hover: "hover:bg-purple-950/30 hover:border-purple-700",
    icon: "text-purple-400",
  },
  blue: {
    selected: "bg-blue-950/50 border-blue-500 text-blue-400",
    hover: "hover:bg-blue-950/30 hover:border-blue-700",
    icon: "text-blue-400",
  },
  pink: {
    selected: "bg-pink-950/50 border-pink-500 text-pink-400",
    hover: "hover:bg-pink-950/30 hover:border-pink-700",
    icon: "text-pink-400",
  },
  zinc: {
    selected: "bg-zinc-800 border-zinc-500 text-zinc-300",
    hover: "hover:bg-zinc-800/50 hover:border-zinc-600",
    icon: "text-zinc-400",
  },
};

export function FeedbackTypeSelector({ value, onChange, onSelect }: FeedbackTypeSelectorProps) {
  const handleClick = (type: FeedbackType) => {
    onChange(type);
    if (onSelect) {
      // Small delay to show selection before proceeding
      setTimeout(() => {
        onSelect(type);
      }, 300);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {feedbackTypes.map((type) => {
        const isSelected = value === type.value;
        const colors = colorClasses[type.color as keyof typeof colorClasses];

        return (
          <button
            key={type.value}
            type="button"
            onClick={() => handleClick(type.value)}
            className={`
              p-4 rounded-xl border-2 text-left transition-all duration-200
              ${
                isSelected
                  ? colors.selected
                  : `bg-neutral-950 border-zinc-800 ${colors.hover}`
              }
            `}
          >
            <div className={`mb-2 ${isSelected ? "" : colors.icon}`}>
              {type.icon}
            </div>
            <p className={`font-medium text-sm ${isSelected ? "" : "text-zinc-300"}`}>
              {type.label}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">{type.description}</p>
          </button>
        );
      })}
    </div>
  );
}