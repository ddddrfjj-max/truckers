'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Package, Loader2 } from 'lucide-react';

export default function AdminShipmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-shipments'],
    queryFn: () => adminApi.shipments({ limit: 100 }),
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Budget</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Bids</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data?.map((s: any) => (
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
                    {s.budgetMin && s.budgetMax ? `${formatCurrency(s.budgetMin)}–${formatCurrency(s.budgetMax)}` : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{s._count?.bids ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
