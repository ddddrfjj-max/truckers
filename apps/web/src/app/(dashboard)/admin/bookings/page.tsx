'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AdminBookingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => adminApi.bookings({ limit: 100 }),
  });

  return (
    <div>
      <PageHeader title="All Bookings" description={`${data?.total ?? 0} total bookings`} />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Shipment</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Shipper</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Driver</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data?.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-48 truncate">{b.shipment?.title}</p>
                    <p className="text-xs text-gray-400">
                      {b.shipment?.pickupCity} → {b.shipment?.deliveryCity}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {b.shipment?.shipper?.profile?.firstName} {b.shipment?.shipper?.profile?.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {b.driver?.profile?.firstName} {b.driver?.profile?.lastName}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(b.agreedAmount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
