'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/Header';
import { DataTable } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Shield, ShieldAlert, FileCode, Search, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [selectedLogMetadata, setSelectedLogMetadata] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, actionFilter, targetTypeFilter],
    queryFn: async () => {
      const params: any = { page, limit: 30 };
      if (actionFilter) params.action = actionFilter;
      if (targetTypeFilter) params.targetType = targetTypeFilter;
      const res = await apiClient.get('/admin/audit-logs', { params });
      return res.data;
    },
  });

  const columns = [
    {
      header: 'Action',
      cell: (log: any) => {
        const actionColors: Record<string, string> = {
          ADMIN_VIEW_IMAGE: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20',
          ADMIN_DELETE_IMAGE: 'text-accent-crimson bg-accent-crimson/10 border-accent-crimson/20',
          ADMIN_SUSPEND_USER: 'text-accent-crimson bg-accent-crimson/10 border-accent-crimson/20',
          ADMIN_RESTORE_USER: 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20',
          ADMIN_ROLE_CHANGE: 'text-accent-amber bg-accent-amber/10 border-accent-amber/20',
          REPORT_RESOLVED: 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20',
          REPORT_DISMISSED: 'text-text-muted bg-surface border-border',
        };

        const style = actionColors[log.action] || 'text-primary-light bg-primary/10 border-primary/20';

        return (
          <span className={`inline-block rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${style}`}>
            {log.action}
          </span>
        );
      },
    },
    {
      header: 'Admin Actor',
      cell: (log: any) => (
        <div>
          <span className="font-semibold text-text-primary">@{log.adminUsername}</span>
          <span className="ml-1 text-[10px] text-text-muted">({log.adminRole})</span>
        </div>
      ),
    },
    {
      header: 'Target Entity',
      cell: (log: any) => (
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-primary uppercase">
            {log.targetType}
          </span>
          {log.targetId && (
            <span className="font-mono text-xs text-text-muted">#{log.targetId.slice(0, 8)}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Timestamp',
      cell: (log: any) => (
        <div>
          <p className="text-xs font-medium text-text-primary">{formatDate(log.createdAt)}</p>
          <p className="text-[10px] text-text-muted">{formatRelativeTime(log.createdAt)}</p>
        </div>
      ),
    },
    {
      header: 'Metadata Payload',
      className: 'text-right',
      cell: (log: any) => (
        <button
          onClick={() => setSelectedLogMetadata(log)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors"
        >
          <FileCode className="h-3.5 w-3.5" /> Payload
        </button>
      ),
    },
  ];

  return (
    <div>
      <Header
        title="Security & Audit Trails"
        description="Immutable record of all privileged administrative events, image access logs, and moderation decisions"
      />

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg bg-surface-card border border-border px-3 py-1.5 text-xs text-accent-cyan">
          <Shield className="h-4 w-4 shrink-0" />
          <span>Audit records are append-only and cannot be altered or deleted.</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-surface-card px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="ADMIN_VIEW_IMAGE">ADMIN_VIEW_IMAGE</option>
            <option value="ADMIN_DELETE_IMAGE">ADMIN_DELETE_IMAGE</option>
            <option value="ADMIN_SUSPEND_USER">ADMIN_SUSPEND_USER</option>
            <option value="ADMIN_RESTORE_USER">ADMIN_RESTORE_USER</option>
            <option value="ADMIN_ROLE_CHANGE">ADMIN_ROLE_CHANGE</option>
            <option value="REPORT_RESOLVED">REPORT_RESOLVED</option>
            <option value="REPORT_DISMISSED">REPORT_DISMISSED</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-surface-card px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="">All Targets</option>
            <option value="IMAGE">IMAGE</option>
            <option value="USER">USER</option>
            <option value="REPORT">REPORT</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
        emptyMessage="No audit logs match current filters."
      />

      {/* Metadata JSON Modal */}
      <Modal
        isOpen={!!selectedLogMetadata}
        onClose={() => setSelectedLogMetadata(null)}
        title={`Audit Event: ${selectedLogMetadata?.action}`}
        maxWidth="lg"
      >
        {selectedLogMetadata && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
              <div>
                <span className="text-text-muted">Actor:</span>
                <p className="font-semibold text-text-primary">
                  @{selectedLogMetadata.adminUsername} ({selectedLogMetadata.adminEmail})
                </p>
              </div>
              <div>
                <span className="text-text-muted">Logged At:</span>
                <p className="font-semibold text-text-primary">{formatDate(selectedLogMetadata.createdAt)}</p>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                JSON Metadata Payload
              </span>
              <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-3 font-mono text-xs text-accent-cyan">
                {JSON.stringify(selectedLogMetadata.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
