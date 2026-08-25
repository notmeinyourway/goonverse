'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Shield, ShieldAlert, User, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  const { user, isSuperAdmin } = useAuth();

  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface-card px-3 py-1.5 text-xs text-text-secondary">
          {isSuperAdmin ? (
            <ShieldAlert className="h-4 w-4 text-accent-amber" />
          ) : (
            <Shield className="h-4 w-4 text-accent-emerald" />
          )}
          <span className="font-semibold text-text-primary">{user?.role}</span>
          <span className="text-text-muted">• {user?.email}</span>
        </div>
      </div>
    </header>
  );
}
