'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { DataTable } from '@/components/DataTable';
import { ConfirmModal } from '@/components/ConfirmModal';
import { formatDate } from '@/lib/utils';
import { Search, Filter, Ban, CheckCircle2, Shield, Eye, AlertTriangle } from 'lucide-react';

export default function UsersManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState<any | null>(null);
  const [selectedUserForRestore, setSelectedUserForRestore] = useState<any | null>(null);

  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, searchTerm, statusFilter, roleFilter],
    queryFn: async () => {
      const params: any = { page, limit: 15 };
      if (searchTerm) params.q = searchTerm;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      const res = await apiClient.get('/admin/users', { params });
      return res.data;
    },
  });

  const handleSuspend = async (reason?: string) => {
    if (!selectedUserForSuspend) return;
    await apiClient.patch(`/admin/users/${selectedUserForSuspend.id}/suspend`, { reason });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const handleRestore = async () => {
    if (!selectedUserForRestore) return;
    await apiClient.patch(`/admin/users/${selectedUserForRestore.id}/restore`);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const columns = [
    {
      header: 'User',
      cell: (user: any) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">@{user.username}</span>
            {user.role === 'SUPER_ADMIN' && (
              <span className="rounded bg-accent-amber/20 px-1.5 py-0.5 text-[10px] font-bold text-accent-amber">
                SUPER_ADMIN
              </span>
            )}
            {user.role === 'MODERATOR' && (
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary-light">
                MODERATOR
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">{user.email}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (user: any) => {
        if (user.status === 'SUSPENDED') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-crimson/15 px-2.5 py-0.5 text-xs font-semibold text-accent-crimson">
              <Ban className="h-3 w-3" /> Suspended
            </span>
          );
        }
        if (user.status === 'DELETED') {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-text-muted">
              Deleted
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-emerald/15 px-2.5 py-0.5 text-xs font-semibold text-accent-emerald">
            <CheckCircle2 className="h-3 w-3" /> Active
          </span>
        );
      },
    },
    {
      header: '18+ Verified',
      cell: (user: any) => (
        <span
          className={`text-xs font-medium ${
            user.ageVerified ? 'text-accent-emerald' : 'text-accent-amber'
          }`}
        >
          {user.ageVerified ? 'Verified' : 'Pending'}
        </span>
      ),
    },
    {
      header: 'Counts',
      cell: (user: any) => (
        <div className="text-xs text-text-secondary space-x-2">
          <span>{user.counts?.people || 0} people</span>
          <span>•</span>
          <span>{user.counts?.images || 0} images</span>
          <span>•</span>
          <span>{user.counts?.activities || 0} logs</span>
        </div>
      ),
    },
    {
      header: 'Registered',
      cell: (user: any) => (
        <span className="text-xs text-text-muted">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (user: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/users/${user.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors"
          >
            <Eye className="h-3.5 w-3.5" /> Inspect
          </Link>

          {isSuperAdmin && user.role !== 'SUPER_ADMIN' && (
            <>
              {user.status === 'SUSPENDED' ? (
                <button
                  onClick={() => setSelectedUserForRestore(user)}
                  className="rounded-md bg-accent-emerald/15 px-2.5 py-1 text-xs font-semibold text-accent-emerald hover:bg-accent-emerald hover:text-white transition-colors"
                >
                  Restore
                </button>
              ) : (
                <button
                  onClick={() => setSelectedUserForSuspend(user)}
                  className="rounded-md bg-accent-crimson/15 px-2.5 py-1 text-xs font-semibold text-accent-crimson hover:bg-accent-crimson hover:text-white transition-colors"
                >
                  Suspend
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header
        title="User Accounts"
        description="Monitor user profiles, verify 18+ age status, and manage suspension policies"
      />

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search username or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-surface-card py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-surface-card px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
            <option value="DELETED">Deleted Only</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-surface-card px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="USER">Regular Users</option>
            <option value="MODERATOR">Moderators</option>
            <option value="SUPER_ADMIN">Super Admins</option>
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
        emptyMessage="No user accounts match current search and filter criteria."
      />

      {/* Suspend Confirmation Modal */}
      <ConfirmModal
        isOpen={!!selectedUserForSuspend}
        onClose={() => setSelectedUserForSuspend(null)}
        onConfirm={handleSuspend}
        title={`Suspend User @${selectedUserForSuspend?.username}`}
        message="Suspension immediately revokes all active JWT login sessions and blocks app access. A reason is mandatory for the audit log."
        confirmText="Suspend User Account"
        isDestructive={true}
        requireReason={true}
        reasonPlaceholder="e.g. Inappropriate profile / violating content policies"
      />

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={!!selectedUserForRestore}
        onClose={() => setSelectedUserForRestore(null)}
        onConfirm={handleRestore}
        title={`Restore User @${selectedUserForRestore?.username}`}
        message="Are you sure you want to lift the suspension on this account? The user will be able to log back into Goonverse."
        confirmText="Restore Account"
        isDestructive={false}
      />
    </div>
  );
}
