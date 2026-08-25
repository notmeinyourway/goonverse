'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { DataTable } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, UserPlus, UserMinus, Shield } from 'lucide-react';

export default function AdministratorsPage() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [selectedUserForRole, setSelectedUserForRole] = useState<any | null>(null);
  const [newRole, setNewRole] = useState<'MODERATOR' | 'USER'>('MODERATOR');
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-staff-list'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users', {
        params: { limit: 100, status: 'ALL' },
      });
      // Filter moderators and super admins
      return {
        ...res.data,
        data: res.data.data.filter(
          (u: any) => u.role === 'SUPER_ADMIN' || u.role === 'MODERATOR',
        ),
      };
    },
    enabled: isSuperAdmin,
  });

  const handleUpdateRole = async () => {
    if (!selectedUserForRole) return;
    setIsUpdating(true);
    try {
      await apiClient.patch(`/admin/users/${selectedUserForRole.id}/role`, { role: newRole });
      queryClient.invalidateQueries({ queryKey: ['admin-staff-list'] });
      setSelectedUserForRole(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="rounded-xl border border-accent-crimson/30 bg-accent-crimson/10 p-6 text-accent-crimson">
        <p className="font-bold">Access Restricted</p>
        <p className="mt-1 text-xs">
          Only accounts with SUPER_ADMIN privileges may manage platform administrators.
        </p>
      </div>
    );
  }

  const columns = [
    {
      header: 'Admin / Moderator',
      cell: (admin: any) => (
        <div>
          <span className="font-semibold text-text-primary">@{admin.username}</span>
          <p className="text-xs text-text-muted">{admin.email}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      cell: (admin: any) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            admin.role === 'SUPER_ADMIN'
              ? 'bg-accent-amber/15 text-accent-amber'
              : 'bg-primary/20 text-primary-light'
          }`}
        >
          {admin.role === 'SUPER_ADMIN' ? (
            <ShieldAlert className="h-3 w-3" />
          ) : (
            <ShieldCheck className="h-3 w-3" />
          )}
          {admin.role}
        </span>
      ),
    },
    {
      header: 'Added On',
      cell: (admin: any) => (
        <span className="text-xs text-text-muted">{formatDate(admin.createdAt)}</span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (admin: any) =>
        admin.role !== 'SUPER_ADMIN' ? (
          <button
            onClick={() => {
              setSelectedUserForRole(admin);
              setNewRole('USER');
            }}
            className="rounded-md border border-accent-crimson/30 bg-accent-crimson/10 px-2.5 py-1 text-xs font-semibold text-accent-crimson hover:bg-accent-crimson hover:text-white transition-colors"
          >
            Revoke Moderator Role
          </button>
        ) : (
          <span className="text-xs text-text-muted italic">Primary Owner</span>
        ),
    },
  ];

  return (
    <div>
      <Header
        title="Administrative Staff"
        description="Manage moderator permissions and role delegations (SUPER_ADMIN privileges required)"
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="No administrators or moderators registered."
      />

      {/* Role Update Modal */}
      <Modal
        isOpen={!!selectedUserForRole}
        onClose={() => setSelectedUserForRole(null)}
        title={`Change Role: @${selectedUserForRole?.username}`}
        maxWidth="md"
      >
        {selectedUserForRole && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Update platform access permissions for{' '}
              <strong className="text-text-primary">@{selectedUserForRole.username}</strong> ({selectedUserForRole.email}).
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                Select Target Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
              >
                <option value="MODERATOR">MODERATOR (Can review reports & images)</option>
                <option value="USER">USER (Standard mobile client user)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={isUpdating}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Update Permissions'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
