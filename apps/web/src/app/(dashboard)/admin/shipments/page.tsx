'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SHIPMENT_STATUSES = ['OPEN', 'BIDDING', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

export default function AdminShipmentsPage() {
  const queryClient = useQueryClient();
  const [pendingStatus, setPendingStatus] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shipments'],
    queryFn: () => adminApi.shipments({ limit: 100 }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateShipmentStatus(id, status),
    onSuccess: (_, { id }) => {
      toast.success('Status updated');
      setPendingStatus((prev) => { const next = { ...prev }; delete next[id]; return next; });
      queryClient.invalidateQueries({ queryKey: ['admin-shipments'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="All Shipments" description={`${data?.total ?? 0} total shipments`} />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Shipment</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Shipper</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Route</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Budget Hint</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Final Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Bids</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Change Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data?.map((s: any) => {
                const selected = pendingStatus[s.id] ?? s.status;
                const dirty = selected !== s.status;
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 max-w-48 truncate">{s.title}</p>
                      <p className="text-xs text-gray-400">{s.cargoType.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{s.shipper?.profile?.firstName} {s.shipper?.profile?.lastName}</p>
                      <p className="text-xs text-gray-400">{s.shipper?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.pickupCity} → {s.deliveryCity}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {s.budgetMax ? formatCurrency(s.budgetMax) : s.budgetMin ? `${formatCurrency(s.budgetMin)}–${formatCurrency(s.budgetMax ?? 0)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {s.booking?.agreedAmount
                        ? <span className="font-semibold text-green-700">{formatCurrency(s.booking.agreedAmount)}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{s._count?.bids ?? 0}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={selected}
                          onChange={(e) => setPendingStatus((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          className="h-8 rounded-md border border-input bg-background text-xs px-2"
                        >
                          {SHIPMENT_STATUSES.map((st) => (
                            <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                        {dirty && (
                          <Button
                            size="sm"
                            className="h-8 text-xs px-3"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: s.id, status: selected })}
                          >
                            {updateStatusMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
