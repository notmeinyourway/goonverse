'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Activity,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, isSuperAdmin, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Images', href: '/images', icon: ImageIcon },
    { name: 'Activities', href: '/activities', icon: Activity },
    { name: 'Reports', href: '/reports', icon: AlertTriangle },
    { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
  ];

  if (isSuperAdmin) {
    navigation.push({ name: 'Administrators', href: '/administrators', icon: ShieldCheck });
  }

  navigation.push({ name: 'Settings', href: '/settings', icon: Settings });

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface text-text-primary">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold tracking-wider text-text-primary">GOONVERSE</span>
          <span className="ml-1.5 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-light">
            Admin
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-text-muted group-hover:text-text-primary',
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between rounded-lg bg-surface-card p-3 border border-border-subtle">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{user?.username || 'Admin'}</p>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  isSuperAdmin ? 'bg-accent-amber' : 'bg-accent-emerald',
                )}
              />
              <p className="truncate text-xs text-text-muted">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="rounded p-1.5 text-text-muted hover:bg-surface-hover hover:text-accent-crimson transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
