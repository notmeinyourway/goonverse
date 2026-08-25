'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { ConfirmModal } from '@/components/ConfirmModal';
import { AdminImageViewerModal } from '@/components/AdminImageViewerModal';
import { formatBytes, formatDate, formatRelativeTime } from '@/lib/utils';
import {
  User,
  Shield,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  Activity,
  ArrowLeft,
  Loader2,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      // This endpoint fetches full user details and logs ADMIN_VIEW_USER
      const res = await apiClient.get(`/admin/users/${userId}`);
      return res.data;
    },
    enabled: !!userId,
  });

  const handleSuspend = async (reason?: string) => {
    await apiClient.patch(`/admin/users/${userId}/suspend`, { reason });
    queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
  };

  const handleRestore = async () => {
    await apiClient.patch(`/admin/users/${userId}/restore`);
    queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="space-y-4">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>
        <div className="rounded-xl border border-accent-crimson/30 bg-accent-crimson/10 p-6 text-accent-crimson">
          <p className="font-semibold">User account not found or access denied.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Users List
        </Link>
      </div>

      <Header
        title={`User: @${user.username}`}
        description={`Account ID: ${user.id}`}
        actions={
          isSuperAdmin && user.role !== 'SUPER_ADMIN' ? (
            user.status === 'SUSPENDED' ? (
              <button
                onClick={() => setShowRestoreModal(true)}
                className="rounded-lg bg-accent-emerald/15 px-3 py-1.5 text-xs font-semibold text-accent-emerald hover:bg-accent-emerald hover:text-white transition-colors"
              >
                Restore Account
              </button>
            ) : (
              <button
                onClick={() => setShowSuspendModal(true)}
                className="rounded-lg bg-accent-crimson/15 px-3 py-1.5 text-xs font-semibold text-accent-crimson hover:bg-accent-crimson hover:text-white transition-colors"
              >
                Suspend Account
              </button>
            )
          ) : undefined
        }
      />

      {/* Account Overview Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-surface-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-text-primary border-b border-border pb-2">
            Account Profile
          </h3>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-text-muted">Username:</span>
              <p className="font-semibold text-text-primary">@{user.username}</p>
            </div>
            <div>
              <span className="text-text-muted">Email:</span>
              <p className="font-semibold text-text-primary">{user.email}</p>
            </div>
            <div className="flex items-center justify-between border-t border-border-subtle pt-2">
              <span className="text-text-muted">Role:</span>
              <span className="font-bold text-primary-light">{user.role}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border-subtle pt-2">
              <span className="text-text-muted">Account Status:</span>
              <span
                className={`font-semibold ${
                  user.status === 'SUSPENDED'
                    ? 'text-accent-crimson'
                    : user.status === 'ACTIVE'
                    ? 'text-accent-emerald'
                    : 'text-text-muted'
                }`}
              >
                {user.status}
              </span>
            </div>
            {user.suspendedAt && (
              <div className="rounded bg-accent-crimson/10 p-2.5 border border-accent-crimson/25 mt-2">
                <span className="font-semibold text-accent-crimson">Suspension Reason:</span>
                <p className="mt-0.5 text-text-primary">{user.suspensionReason || 'No reason specified'}</p>
                <p className="mt-1 text-[10px] text-text-muted">
                  Suspended on {formatDate(user.suspendedAt)}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border-subtle pt-2">
              <span className="text-text-muted">18+ Verification:</span>
              <span className="text-accent-emerald font-semibold">
                {user.ageVerified ? 'Verified 18+' : 'Unverified'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border-subtle pt-2">
              <span className="text-text-muted">Registration Date:</span>
              <span className="text-text-secondary">{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Activity Summary Card */}
        <div className="rounded-xl border border-border bg-surface-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-text-primary border-b border-border pb-2">
            Usage Metrics
          </h3>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-surface p-3 border border-border-subtle">
              <span className="block text-2xl font-bold text-text-primary">
                {user.counts?.people || 0}
              </span>
              <span className="text-[10px] text-text-muted uppercase">People</span>
            </div>
            <div className="rounded-lg bg-surface p-3 border border-border-subtle">
              <span className="block text-2xl font-bold text-accent-cyan">
                {user.counts?.images || 0}
              </span>
              <span className="text-[10px] text-text-muted uppercase">Images</span>
            </div>
            <div className="rounded-lg bg-surface p-3 border border-border-subtle">
              <span className="block text-2xl font-bold text-accent-emerald">
                {user.counts?.activities || 0}
              </span>
              <span className="text-[10px] text-text-muted uppercase">Logs</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <span className="text-text-muted font-semibold">Recent Person Entries:</span>
            {user.recentPeople?.length === 0 ? (
              <p className="text-text-muted">No people created</p>
            ) : (
              <div className="space-y-1.5">
                {user.recentPeople?.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded bg-surface p-2 border border-border-subtle"
                  >
                    <span className="font-medium text-text-primary">{p.name}</span>
                    <span className="text-[10px] text-text-muted">{formatRelativeTime(p.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="rounded-xl border border-border bg-surface-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-text-primary border-b border-border pb-2">
            Recent Logged Activities
          </h3>

          <div className="space-y-2 text-xs">
            {user.recentActivities?.length === 0 ? (
              <p className="text-text-muted text-center py-6">No recorded activities</p>
            ) : (
              user.recentActivities?.map((act: any) => (
                <div
                  key={act.id}
                  className="rounded-lg bg-surface p-2.5 border border-border-subtle space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-light">
                      {act.person?.name || 'General Activity'}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {formatRelativeTime(act.occurred_at)}
                    </span>
                  </div>
                  {act.notes && <p className="text-text-secondary text-[11px] italic">"{act.notes}"</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Vault Images */}
      <div className="mt-8 rounded-xl border border-border bg-surface-card p-5">
        <h3 className="text-sm font-bold text-text-primary border-b border-border pb-3">
          User Vault Media Preview ({user.recentImages?.length || 0})
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {user.recentImages?.length === 0 ? (
            <p className="col-span-full py-8 text-center text-xs text-text-muted">
              User has not uploaded any private vault images.
            </p>
          ) : (
            user.recentImages?.map((img: any) => (
              <button
                key={img.id}
                onClick={() => setSelectedImageId(img.id)}
                className="group flex flex-col items-center rounded-lg border border-border bg-surface p-3 text-left transition-all hover:border-primary hover:bg-surface-hover"
              >
                <div className="flex h-16 w-full items-center justify-center rounded bg-surface-card text-text-muted group-hover:text-primary">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <p className="mt-2 w-full truncate text-[11px] font-semibold text-text-primary">
                  {img.original_filename}
                </p>
                <span className="mt-0.5 text-[10px] text-text-muted">{formatBytes(img.file_size)}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ImageViewer Modal */}
      <AdminImageViewerModal
        imageId={selectedImageId}
        onClose={() => setSelectedImageId(null)}
        onImageDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
        }}
      />

      {/* Suspend Confirmation Modal */}
      <ConfirmModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={handleSuspend}
        title={`Suspend @${user.username}`}
        message="Suspension immediately blocks app login and invalidates tokens. Reason will be logged."
        confirmText="Suspend User"
        isDestructive={true}
        requireReason={true}
      />

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={handleRestore}
        title={`Restore @${user.username}`}
        message="Restore user access to Goonverse application?"
        confirmText="Restore Access"
      />
    </div>
  );
}
