'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { Shield, ShieldAlert, Key, HardDrive, Lock, Server } from 'lucide-react';

export default function SettingsPage() {
  const { user, isSuperAdmin } = useAuth();

  return (
    <div>
      <Header
        title="Admin Settings & System Posture"
        description="Platform configuration, security policies, and administrative credentials"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Admin Identity */}
        <div className="rounded-xl border border-border bg-surface-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3 text-sm font-bold text-text-primary">
            <Shield className="h-4 w-4 text-primary-light" />
            <span>Active Admin Profile</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-text-muted">Username:</span>
              <p className="font-semibold text-text-primary">@{user?.username}</p>
            </div>
            <div>
              <span className="text-text-muted">Email:</span>
              <p className="font-semibold text-text-primary">{user?.email}</p>
            </div>
            <div>
              <span className="text-text-muted">Assigned Security Role:</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded bg-primary/20 px-2 py-0.5 font-bold text-primary-light">
                  {user?.role}
                </span>
                {isSuperAdmin && (
                  <span className="text-[11px] text-accent-amber font-semibold">
                    (Full Platform & Privilege Control)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Policy */}
        <div className="rounded-xl border border-border bg-surface-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3 text-sm font-bold text-text-primary">
            <Lock className="h-4 w-4 text-accent-cyan" />
            <span>Zero-Trust Storage Architecture</span>
          </div>

          <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
            <p>
              • <strong>No Public URLs:</strong> All user media is stored privately in Backblaze B2.
            </p>
            <p>
              • <strong>Short-Lived Access:</strong> Image views generate temporary pre-signed URLs valid for 15 minutes.
            </p>
            <p>
              • <strong>Mandatory Auditing:</strong> Every admin view or removal action is logged with identity and timestamp.
            </p>
            <p>
              • <strong>Role-Based Tokens:</strong> Mobile client endpoints are strictly isolated from administrative control APIs.
            </p>
          </div>
        </div>

        {/* Backend & Environment Status */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3 text-sm font-bold text-text-primary">
            <Server className="h-4 w-4 text-accent-emerald" />
            <span>Infrastructure Connectivity</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-lg bg-surface p-3 border border-border-subtle">
              <span className="text-text-muted">Backend API</span>
              <p className="mt-1 font-mono font-semibold text-text-primary">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}
              </p>
              <span className="mt-1 inline-block rounded bg-accent-emerald/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-emerald">
                Connected
              </span>
            </div>

            <div className="rounded-lg bg-surface p-3 border border-border-subtle">
              <span className="text-text-muted">Private Storage Engine</span>
              <p className="mt-1 font-semibold text-text-primary">Backblaze B2 (S3 API)</p>
              <span className="mt-1 inline-block rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary-light">
                Encrypted Vault
              </span>
            </div>

            <div className="rounded-lg bg-surface p-3 border border-border-subtle">
              <span className="text-text-muted">Database Engine</span>
              <p className="mt-1 font-semibold text-text-primary">PostgreSQL / Prisma ORM</p>
              <span className="mt-1 inline-block rounded bg-accent-cyan/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-cyan">
                Active & Indexed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
