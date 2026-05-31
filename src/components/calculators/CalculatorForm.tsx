// File: src/components/calculators/CalculatorForm.tsx
import { ReactNode, FormEvent } from "react";

interface CalculatorFormProps {
  children: ReactNode;
  onSubmit?: (e: FormEvent) => void;
}

export function CalculatorForm({ children, onSubmit }: CalculatorFormProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {children}
    </form>
  );
}

interface FormRowProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
}

export function FormRow({ children, columns = 2 }: FormRowProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  return <div className={`grid ${gridCols[columns]} gap-4`}>{children}</div>;
}

interface FormSectionProps {
  title?: string;
  children: ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}