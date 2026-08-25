'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { formatBytes, formatDate, formatRelativeTime } from '@/lib/utils';
import {
  Users,
  Image as ImageIcon,
  Activity,
  AlertTriangle,
  HardDrive,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard-overview'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/dashboard');
      return res.data;
    },
    refetchInterval: 15000, // Auto refresh every 15s
  });

  const metrics = data?.metrics;

  return (
    <div>
      <Header
        title="Command Dashboard"
        description="Real-time platform metrics, storage utilization, and moderation queue"
        actions={
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-border bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover transition-colors"
          >
            Refresh Data
          </button>
        }
      />

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={isLoading ? '—' : metrics?.users?.total || 0}
          subtitle={`${metrics?.users?.active || 0} active • ${metrics?.users?.suspended || 0} suspended`}
          icon={Users}
          color="violet"
          badgeText={metrics?.users?.newLast24Hours ? `+${metrics.users.newLast24Hours} in 24h` : undefined}
        />

        <StatCard
          title="Encrypted Vault Media"
          value={isLoading ? '—' : metrics?.images?.total || 0}
          subtitle={`${metrics?.images?.storageMB || 0} MB stored in B2`}
          icon={ImageIcon}
          color="cyan"
          badgeText={metrics?.images?.newLast24Hours ? `+${metrics.images.newLast24Hours} in 24h` : undefined}
        />

        <StatCard
          title="Logged Activities"
          value={isLoading ? '—' : metrics?.activities?.total || 0}
          subtitle={`${metrics?.activities?.newLast24Hours || 0} recorded in 24h`}
          icon={Activity}
          color="emerald"
        />

        <StatCard
          title="Pending Reports"
          value={isLoading ? '—' : metrics?.moderation?.pendingTotal || 0}
          subtitle={`${metrics?.moderation?.openReports || 0} open • ${metrics?.moderation?.underReviewReports || 0} under review`}
          icon={AlertTriangle}
          color={metrics?.moderation?.pendingTotal > 0 ? 'crimson' : 'amber'}
        />
      </div>

      {/* Mid Section: Storage Breakdown & Pending Reports */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Storage Distribution */}
        <div className="rounded-xl border border-border bg-surface-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
              <HardDrive className="h-4 w-4 text-primary-light" />
              <span>Storage by Format</span>
            </div>
            <span className="text-xs font-semibold text-text-muted">
              {metrics?.images?.storageMB ? `${metrics.images.storageMB} MB` : '0 MB'}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 rounded bg-surface animate-pulse" />
                <div className="h-4 rounded bg-surface animate-pulse" />
              </div>
            ) : data?.storageByMimeType?.length === 0 ? (
              <p className="text-center text-xs text-text-muted py-6">No media uploaded yet</p>
            ) : (
              data?.storageByMimeType?.map((item: any) => (
                <div key={item.mimeType} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-text-primary">{item.mimeType}</span>
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-text-muted">
                      {item.count} files
                    </span>
                  </div>
                  <span className="font-semibold text-text-secondary">{item.totalMB} MB</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Priority Reports Queue */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
              <AlertTriangle className="h-4 w-4 text-accent-amber" />
              <span>Recent Moderation Reports</span>
            </div>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-light hover:underline"
            >
              View Queue <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-border-subtle">
            {isLoading ? (
              <div className="space-y-2 py-4">
                <div className="h-4 rounded bg-surface animate-pulse" />
                <div className="h-4 rounded bg-surface animate-pulse" />
              </div>
            ) : data?.recentReports?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                <ShieldCheck className="h-8 w-8 text-accent-emerald" />
                <p className="mt-2 text-xs">No pending moderation reports. System clean.</p>
              </div>
            ) : (
              data?.recentReports?.map((report: any) => (
                <div key={report.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-surface px-2 py-0.5 text-[11px] font-bold text-text-primary uppercase">
                        {report.targetType}
                      </span>
                      <span className="text-xs font-medium text-text-primary">{report.reason}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-text-muted">
                      Reported by @{report.reporterUsername} • {formatRelativeTime(report.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      report.status === 'OPEN'
                        ? 'bg-accent-crimson/15 text-accent-crimson'
                        : 'bg-accent-amber/15 text-accent-amber'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Admin Activity Stream */}
      <div className="mt-8 rounded-xl border border-border bg-surface-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
            <Clock className="h-4 w-4 text-primary-light" />
            <span>Recent Admin Audit Stream</span>
          </div>
          <Link
            href="/audit-logs"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-light hover:underline"
          >
            All Audit Records <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 divide-y divide-border-subtle">
          {isLoading ? (
            <div className="space-y-2 py-4">
              <div className="h-4 rounded bg-surface animate-pulse" />
              <div className="h-4 rounded bg-surface animate-pulse" />
            </div>
          ) : data?.recentAuditLogs?.length === 0 ? (
            <p className="text-center text-xs text-text-muted py-6">No audit records recorded yet</p>
          ) : (
            data?.recentAuditLogs?.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-accent-cyan">{log.action}</span>
                  <span className="text-text-muted">by</span>
                  <span className="font-medium text-text-primary">@{log.adminUsername}</span>
                  <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-text-muted">
                    {log.targetType} {log.targetId ? `#${log.targetId.slice(0, 8)}` : ''}
                  </span>
                </div>
                <span className="text-text-muted">{formatRelativeTime(log.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
