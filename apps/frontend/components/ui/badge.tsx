import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'high' | 'medium' | 'low';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary text-secondary-foreground border-transparent',
    outline: 'border-border text-foreground',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    destructive: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold',
    medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30 font-semibold',
    low: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
