'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { formatBytes, formatDate } from '@/lib/utils';
import { Trash2, ShieldAlert, User, Calendar, FileText, Loader2 } from 'lucide-react';

interface AdminImageViewerModalProps {
  imageId: string | null;
  onClose: () => void;
  onImageDeleted?: () => void;
}

export function AdminImageViewerModal({
  imageId,
  onClose,
  onImageDeleted,
}: AdminImageViewerModalProps) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-image-view', imageId],
    queryFn: async () => {
      if (!imageId) return null;
      // This call generates short-lived signed URL and logs ADMIN_VIEW_IMAGE audit event
      const res = await apiClient.get(`/admin/images/${imageId}`);
      return res.data;
    },
    enabled: !!imageId,
  });

  const handleRemoveImage = async (reason?: string) => {
    if (!imageId) return;
    await apiClient.delete(`/admin/images/${imageId}`, {
      data: { reason: reason || 'Moderation decision' },
    });
    if (onImageDeleted) onImageDeleted();
    onClose();
  };

  if (!imageId) return null;

  return (
    <>
      <Modal isOpen={!!imageId} onClose={onClose} title="Authorized Media Inspection" maxWidth="4xl">
        {isLoading ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 text-text-muted">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Fetching authorized short-lived access & recording audit...</p>
          </div>
        ) : isError || !data ? (
          <div className="rounded-xl border border-accent-crimson/30 bg-accent-crimson/10 p-6 text-center text-accent-crimson">
            <p className="font-semibold">Failed to inspect media</p>
            <p className="mt-1 text-xs opacity-80">
              {(error as any)?.response?.data?.message || 'Media not found or access denied'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Image Preview */}
            <div className="lg:col-span-2 flex items-center justify-center overflow-hidden rounded-xl border border-border bg-black/80 p-2 min-h-[340px]">
              <img
                src={data.url}
                alt={data.originalFilename}
                className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow"
              />
            </div>

            {/* Metadata & Actions */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="rounded-lg bg-surface p-3 border border-border-subtle">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent-amber">
                    <ShieldAlert className="h-4 w-4" />
                    <span>AUDITED ACCESS</span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">
                    This view event was recorded in the immutable audit log under your admin identity.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-text-secondary">
                  <div>
                    <span className="text-text-muted">Filename:</span>
                    <p className="font-semibold text-text-primary truncate">{data.originalFilename}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Image ID:</span>
                    <p className="font-mono text-[11px] text-text-muted truncate">{data.id}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border-subtle pt-2">
                    <span className="text-text-muted">File Size:</span>
                    <span className="font-medium text-text-primary">{formatBytes(data.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border-subtle pt-2">
                    <span className="text-text-muted">MIME Type:</span>
                    <span className="font-mono text-text-primary">{data.mimeType}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border-subtle pt-2">
                    <span className="text-text-muted">Uploaded:</span>
                    <span className="text-text-primary">{formatDate(data.createdAt)}</span>
                  </div>
                  {data.owner && (
                    <div className="border-t border-border-subtle pt-2">
                      <span className="text-text-muted">Owner Account:</span>
                      <p className="font-medium text-text-primary">{data.owner.username}</p>
                      <p className="text-[11px] text-text-muted truncate">{data.owner.email}</p>
                    </div>
                  )}
                  {data.person && (
                    <div className="border-t border-border-subtle pt-2">
                      <span className="text-text-muted">Associated Person:</span>
                      <p className="font-medium text-primary-light">{data.person.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Moderation Removal Button */}
              <div className="pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-crimson/15 px-4 py-2.5 text-sm font-semibold text-accent-crimson border border-accent-crimson/30 hover:bg-accent-crimson hover:text-white transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Prohibited Content
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemoveImage}
        title="Remove Prohibited Image"
        message="Are you sure you want to remove this image from user accessibility? A reason is required for the audit record."
        confirmText="Remove Image"
        isDestructive={true}
        requireReason={true}
        reasonPlaceholder="e.g. Violation of 18+ content standards / Terms of service"
      />
    </>
  );
}
