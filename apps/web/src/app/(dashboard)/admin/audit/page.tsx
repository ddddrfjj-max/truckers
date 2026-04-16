'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  'USER.LOGIN': 'bg-blue-50 text-blue-700',
  'USER.REGISTER': 'bg-green-50 text-green-700',
  'BID.PLACED': 'bg-purple-50 text-purple-700',
  'BID.ACCEPTED': 'bg-green-50 text-green-700',
  'BID.WITHDRAWN': 'bg-orange-50 text-orange-700',
  'BOOKING.STATUS_UPDATED': 'bg-blue-50 text-blue-700',
  'SHIPMENT.CREATED': 'bg-teal-50 text-teal-700',
  'SHIPMENT.CANCELLED': 'bg-red-50 text-red-700',
  'ADMIN.USER_STATUS_UPDATED': 'bg-orange-50 text-orange-700',
  'ADMIN.DOCUMENT_REVIEWED': 'bg-purple-50 text-purple-700',
};

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', cls)}>
      {action}
    </span>
  );
}

function formatTs(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search, entityType, page],
    queryFn: () => adminApi.auditLogs({ search: search || undefined, entityType: entityType || undefined, page, limit: 50 }),
  });

  const logs = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      <PageHeader
        title="Security Audit Log"
        description="Complete record of all security-relevant actions across the platform"
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search actions, entities, IPs..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
        >
          <option value="">All entity types</option>
          <option value="User">User</option>
          <option value="Shipment">Shipment</option>
          <option value="Bid">Bid</option>
          <option value="Booking">Booking</option>
          <option value="Document">Document</option>
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Events', value: data?.total ?? 0 },
          { label: 'This Page', value: logs.length },
          { label: 'Page', value: `${page} / ${totalPages}` },
          { label: 'Per Page', value: 50 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No audit events found</p>
          <p className="text-sm text-gray-400 mt-1">Events will appear here as users take actions</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Timestamp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">IP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
                        {formatTs(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700 font-medium">{log.entityType}</p>
                        {log.entityId && (
                          <p className="text-xs text-gray-400 font-mono truncate max-w-28" title={log.entityId}>
                            {log.entityId.substring(0, 12)}…
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div>
                            <p className="text-gray-800 font-medium">
                              {log.user.profile?.firstName} {log.user.profile?.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{log.user.email}</p>
                            <span className={cn(
                              'text-xs px-1.5 py-0.5 rounded font-medium',
                              log.user.role === 'ADMIN' ? 'bg-purple-50 text-purple-600' :
                              log.user.role === 'DRIVER' ? 'bg-green-50 text-green-600' :
                              'bg-blue-50 text-blue-600'
                            )}>
                              {log.user.role}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                        {log.ip || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {log.after && (
                          <details className="cursor-pointer">
                            <summary className="text-xs text-blue-600 hover:text-blue-700">View data</summary>
                            <pre className="text-xs text-gray-600 mt-1 bg-gray-50 rounded p-2 max-w-xs overflow-auto">
                              {JSON.stringify(log.after, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, data?.total)} of {data?.total} events
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
