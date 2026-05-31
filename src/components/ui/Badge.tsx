interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'premium';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-zinc-800 text-zinc-300',
    premium: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-900',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}