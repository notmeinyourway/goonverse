'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/Header';
import { AdminImageViewerModal } from '@/components/AdminImageViewerModal';
import { formatBytes, formatDate } from '@/lib/utils';
import {
  Image as ImageIcon,
  Search,
  Filter,
  Eye,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function ImagesGalleryPage() {
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [mimeFilter, setMimeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-images-gallery', page, statusFilter, mimeFilter],
    queryFn: async () => {
      const params: any = { page, limit: 18, status: statusFilter };
      if (mimeFilter) params.mimeType = mimeFilter;
      const res = await apiClient.get('/admin/images', { params });
      return res.data;
    },
  });

  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div>
      <Header
        title="Encrypted Media Gallery"
        description="Private Backblaze B2 vault files. Note: Viewing any image generates a signed URL and is recorded in the audit log."
      />

      {/* Filter and Control Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg bg-surface-card border border-border px-3 py-1.5 text-xs text-accent-amber">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Image viewing is strictly audited under zero-trust moderation protocols</span>
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
            <option value="ACTIVE">Active Media Only</option>
            <option value="DELETED">Removed / Deleted</option>
            <option value="ALL">All Media</option>
          </select>

          <select
            value={mimeFilter}
            onChange={(e) => {
              setMimeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-surface-card px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="">All Formats</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
            <option value="image/gif">GIF</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="h-44 rounded-xl bg-surface-card animate-pulse border border-border" />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-card py-16 text-text-muted">
          <ImageIcon className="h-12 w-12 stroke-1" />
          <p className="mt-2 text-sm">No vault media found matching criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {data.data.map((img: any) => (
            <div
              key={img.id}
              className="group flex flex-col justify-between rounded-xl border border-border bg-surface-card p-3 shadow-sm hover:border-primary/50 transition-all duration-200"
            >
              <div>
                {/* Thumbnail placeholder with click to view */}
                <div
                  onClick={() => setSelectedImageId(img.id)}
                  className="relative flex h-28 w-full cursor-pointer items-center justify-center rounded-lg bg-surface text-text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors overflow-hidden"
                >
                  <Lock className="h-6 w-6 opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-bold text-white shadow">
                      <Eye className="h-3 w-3" /> Audit & View
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1">
                  <p className="truncate text-xs font-semibold text-text-primary" title={img.originalFilename}>
                    {img.originalFilename}
                  </p>
                  <p className="truncate text-[11px] text-text-muted">
                    by <span className="text-text-secondary">@{img.ownerUsername}</span>
                  </p>
                  {img.personName && (
                    <p className="truncate text-[10px] text-primary-light font-medium">
                      Person: {img.personName}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2 text-[10px] text-text-muted">
                <span>{formatBytes(img.fileSize)}</span>
                <span
                  className={
                    img.status === 'DELETED' ? 'text-accent-crimson font-bold' : 'text-accent-emerald'
                  }
                >
                  {img.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between rounded-xl border border-border bg-surface-card px-4 py-3 text-xs text-text-secondary">
          <div>
            Page <span className="font-bold text-text-primary">{page}</span> of{' '}
            <span className="font-bold text-text-primary">{totalPages}</span> ({data?.meta?.total} total images)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || isLoading}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 font-medium text-text-primary hover:bg-surface-hover disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 font-medium text-text-primary hover:bg-surface-hover disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Image Inspector Modal */}
      <AdminImageViewerModal
        imageId={selectedImageId}
        onClose={() => setSelectedImageId(null)}
        onImageDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-images-gallery'] });
        }}
      />
    </div>
  );
}
