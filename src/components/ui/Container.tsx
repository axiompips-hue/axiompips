// File: src/components/ui/Container.tsx
import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "default" | "small" | "large";
}

export function Container({
  children,
  className = "",
  size = "default",
}: ContainerProps) {
  const sizeClasses = {
    small: "max-w-4xl",
    default: "max-w-7xl",
    large: "max-w-screen-2xl",
  };

  return (
    <div
      className={`
        mx-auto w-full px-4 sm:px-6 lg:px-8
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}