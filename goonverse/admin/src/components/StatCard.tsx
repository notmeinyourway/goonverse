import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'violet' | 'amber' | 'emerald' | 'crimson' | 'cyan';
  badgeText?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'violet',
  badgeText,
}: StatCardProps) {
  const colorMap = {
    violet: {
      bg: 'bg-primary/10',
      text: 'text-primary-light',
      border: 'border-primary/30',
    },
    amber: {
      bg: 'bg-accent-amber/10',
      text: 'text-accent-amber',
      border: 'border-accent-amber/30',
    },
    emerald: {
      bg: 'bg-accent-emerald/10',
      text: 'text-accent-emerald',
      border: 'border-accent-emerald/30',
    },
    crimson: {
      bg: 'bg-accent-crimson/10',
      text: 'text-accent-crimson',
      border: 'border-accent-crimson/30',
    },
    cyan: {
      bg: 'bg-accent-cyan/10',
      text: 'text-accent-cyan',
      border: 'border-accent-cyan/30',
    },
  };

  const selectedColor = colorMap[color];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface-card p-5 transition-all duration-200 hover:border-border-subtle hover:bg-surface-card/90">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {title}
        </span>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', selectedColor.bg)}>
          <Icon className={cn('h-5 w-5', selectedColor.text)} />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-text-primary">{value}</span>
        {badgeText && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
              selectedColor.bg,
              selectedColor.text,
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
    </div>
  );
}
