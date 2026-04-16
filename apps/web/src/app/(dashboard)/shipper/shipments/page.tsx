'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { shipmentsApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatCurrency, formatWeight } from '@/lib/utils';
import { Plus, Search, Package, MapPin, Loader2, ArrowRight } from 'lucide-react';

export default function ShipperShipmentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-shipments', search, status],
    queryFn: () => shipmentsApi.myShipments({ search, status, limit: 50 }),
  });

  return (
    <div>
      <PageHeader
        title="My Shipments"
        description="Manage and track all your posted loads"
        action={
          <Link href="/shipper/shipments/new">
            <Button className="gap-2"><Plus className="w-4 h-4" /> Post a Load</Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search shipments..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="BIDDING">Bidding</option>
          <option value="BOOKED">Booked</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : !data?.data?.length ? (
        <EmptyState
          icon={Package}
          title="No shipments found"
          description="You haven't posted any loads yet. Create your first shipment to get started."
          action={
            <Link href="/shipper/shipments/new">
              <Button className="gap-2"><Plus className="w-4 h-4" /> Post Your First Load</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.data.map((s: any) => (
            <Link
              key={s.id}
              href={`/shipper/shipments/${s.id}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{s.title}</h3>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {s.pickupCity}, {s.pickupState} → {s.deliveryCity}, {s.deliveryState}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Pickup: {formatDate(s.pickupDate)}</span>
                    <span>{formatWeight(s.weightKg)}</span>
                    <span>{s.cargoType.replace(/_/g, ' ')}</span>
                    {(s.budgetMin || s.budgetMax) && (
                      <span>
                        Budget: {s.budgetMin ? formatCurrency(s.budgetMin) : '?'} – {s.budgetMax ? formatCurrency(s.budgetMax) : '?'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{s._count?.bids ?? 0}</p>
                    <p className="text-xs text-gray-400">bids</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
