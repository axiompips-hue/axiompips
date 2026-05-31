// File Location: src/components/auth/Divider.tsx
// Description: Horizontal divider with optional text in the middle

interface DividerProps {
  text?: string;
}

export function Divider({ text = "or" }: DividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-800" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-neutral-900 text-zinc-500">{text}</span>
      </div>
    </div>
  );
}