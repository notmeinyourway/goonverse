'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/Header';
import { DataTable } from '@/components/DataTable';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Activity, Search, Calendar, User, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ActivitiesManagementPage() {
  const [page, setPage] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activities', page, userIdFilter],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (userIdFilter) params.userId = userIdFilter;
      const res = await apiClient.get('/admin/activities', { params });
      return res.data;
    },
  });

  const columns = [
    {
      header: 'User',
      cell: (act: any) => (
        <div>
          <Link
            href={`/users/${act.userId}`}
            className="font-semibold text-text-primary hover:text-primary-light transition-colors"
          >
            @{act.username}
          </Link>
          <p className="font-mono text-[10px] text-text-muted">{act.userId.slice(0, 8)}...</p>
        </div>
      ),
    },
    {
      header: 'Person Entry',
      cell: (act: any) =>
        act.personName ? (
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary-light">
            {act.personName}
          </span>
        ) : (
          <span className="text-xs text-text-muted">Unspecified</span>
        ),
    },
    {
      header: 'Associated Media',
      cell: (act: any) =>
        act.imageFilename ? (
          <span className="font-mono text-xs text-text-secondary">{act.imageFilename}</span>
        ) : (
          <span className="text-xs text-text-muted">None</span>
        ),
    },
    {
      header: 'Notes',
      cell: (act: any) => (
        <span className="text-xs text-text-secondary line-clamp-1">
          {act.notes || '—'}
        </span>
      ),
    },
    {
      header: 'Occurred At',
      cell: (act: any) => (
        <div>
          <p className="text-xs font-medium text-text-primary">{formatDate(act.occurredAt)}</p>
          <p className="text-[10px] text-text-muted">{formatRelativeTime(act.occurredAt)}</p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header
        title="Activity Stream Monitoring"
        description="Comprehensive timeline of recorded personal sessions and associated entries"
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total}
        onPageChange={setPage}
        emptyMessage="No activity events recorded."
      />
    </div>
  );
}
