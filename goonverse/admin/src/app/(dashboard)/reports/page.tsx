'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/Header';
import { DataTable } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { AdminImageViewerModal } from '@/components/AdminImageViewerModal';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Shield,
  MessageSquare,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function ReportsModerationPage() {
  const [statusTab, setStatusTab] = useState('OPEN');
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [inspectImageId, setInspectImageId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports-queue', statusTab, page],
    queryFn: async () => {
      const params: any = { page, limit: 15 };
      if (statusTab !== 'ALL') params.status = statusTab;
      const res = await apiClient.get('/admin/reports', { params });
      return res.data;
    },
  });

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedReport) return;
    setIsUpdatingStatus(true);
    try {
      await apiClient.patch(`/admin/reports/${selectedReport.id}/status`, {
        status: newStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-overview'] });
      setSelectedReport(null);
      setResolutionNotes('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update report status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const columns = [
    {
      header: 'Reported Entity',
      cell: (r: any) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-primary">
              {r.targetType}
            </span>
            <span className="font-mono text-xs text-text-secondary">#{r.targetId.slice(0, 8)}</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-text-primary">{r.reason}</p>
        </div>
      ),
    },
    {
      header: 'Reporter',
      cell: (r: any) => (
        <div>
          <span className="text-xs font-medium text-text-primary">@{r.reporter.username}</span>
          <p className="text-[10px] text-text-muted">{r.reporter.email}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (r: any) => {
        const badgeStyle = {
          OPEN: 'bg-accent-crimson/15 text-accent-crimson',
          UNDER_REVIEW: 'bg-accent-amber/15 text-accent-amber',
          RESOLVED: 'bg-accent-emerald/15 text-accent-emerald',
          DISMISSED: 'bg-surface text-text-muted',
        }[r.status as string] || 'bg-surface text-text-secondary';

        return (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}>
            {r.status}
          </span>
        );
      },
    },
    {
      header: 'Submitted',
      cell: (r: any) => (
        <div>
          <p className="text-xs font-medium text-text-primary">{formatDate(r.createdAt)}</p>
          <p className="text-[10px] text-text-muted">{formatRelativeTime(r.createdAt)}</p>
        </div>
      ),
    },
    {
      header: 'Reviewer',
      cell: (r: any) => (
        <span className="text-xs text-text-muted">
          {r.reviewer ? `@${r.reviewer.username}` : 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (r: any) => (
        <button
          onClick={() => {
            setSelectedReport(r);
            setResolutionNotes(r.resolutionNotes || '');
          }}
          className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-primary hover:bg-surface-hover transition-colors"
        >
          Moderate
        </button>
      ),
    },
  ];

  return (
    <div>
      <Header
        title="Moderation & Reports Queue"
        description="Review incoming user reports, investigate violations, and resolve compliance tickets"
      />

      {/* Tabs */}
      <div className="mb-6 flex border-b border-border space-x-4">
        {[
          { id: 'OPEN', label: 'Open Queue' },
          { id: 'UNDER_REVIEW', label: 'Under Review' },
          { id: 'RESOLVED', label: 'Resolved' },
          { id: 'DISMISSED', label: 'Dismissed' },
          { id: 'ALL', label: 'All Reports' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusTab(tab.id);
              setPage(1);
            }}
            className={`pb-3 text-xs font-semibold transition-all ${
              statusTab === tab.id
                ? 'border-b-2 border-primary text-primary-light'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
        emptyMessage="No reports found in this status category."
      />

      {/* Moderation Action Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={`Moderation Ticket #${selectedReport?.id?.slice(0, 8)}`}
        maxWidth="lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="rounded-lg bg-surface p-3.5 border border-border-subtle space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-muted">Target Entity:</span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/20 px-2 py-0.5 font-bold text-primary-light uppercase">
                    {selectedReport.targetType}
                  </span>
                  <span className="font-mono text-text-secondary">{selectedReport.targetId}</span>
                </div>
              </div>

              {selectedReport.targetType === 'IMAGE' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setInspectImageId(selectedReport.targetId)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary-light hover:bg-primary hover:text-white transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" /> Inspect Image with Audit Log
                  </button>
                </div>
              )}

              {selectedReport.targetType === 'USER' && (
                <div className="pt-2">
                  <Link
                    href={`/users/${selectedReport.targetId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary-light hover:bg-primary hover:text-white transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" /> Inspect User Account
                  </Link>
                </div>
              )}

              <div className="border-t border-border-subtle pt-2">
                <span className="font-semibold text-text-muted">Report Reason:</span>
                <p className="mt-0.5 font-medium text-text-primary">{selectedReport.reason}</p>
              </div>

              {selectedReport.description && (
                <div className="border-t border-border-subtle pt-2">
                  <span className="font-semibold text-text-muted">User Description:</span>
                  <p className="mt-0.5 text-text-secondary italic">"{selectedReport.description}"</p>
                </div>
              )}
            </div>

            {/* Moderator Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                Moderator Decision Notes / Audit Rationale
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe actions taken (e.g., content removed, user warned, false report)..."
                rows={3}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>

            {/* Status Update Actions */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                disabled={isUpdatingStatus}
                className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 py-2 text-xs font-semibold text-accent-amber hover:bg-accent-amber hover:text-black transition-all disabled:opacity-50"
              >
                Mark Under Review
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus('RESOLVED')}
                disabled={isUpdatingStatus}
                className="rounded-lg bg-accent-emerald/20 border border-accent-emerald/40 py-2 text-xs font-semibold text-accent-emerald hover:bg-accent-emerald hover:text-white transition-all disabled:opacity-50"
              >
                Resolve Violation
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus('DISMISSED')}
                disabled={isUpdatingStatus}
                className="rounded-lg border border-border bg-surface py-2 text-xs font-semibold text-text-muted hover:bg-surface-hover hover:text-text-primary transition-all disabled:opacity-50"
              >
                Dismiss Ticket
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Embedded Image Inspector Modal */}
      <AdminImageViewerModal
        imageId={inspectImageId}
        onClose={() => setInspectImageId(null)}
      />
    </div>
  );
}
