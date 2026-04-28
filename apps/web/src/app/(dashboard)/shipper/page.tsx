'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { shipmentsApi, bookingsApi, usersApi } from '@/lib/api';
import { OnboardingModal } from '@/components/onboarding-modal';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Package,
  Plus,
  TrendingUp,
  CheckCircle,
  Clock,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function ShipperDashboard() {
  const { data: session } = useSession();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['shipper-stats'],
    queryFn: shipmentsApi.myStats,
  });

  const { data: shipmentsData, isLoading: shipmentsLoading } = useQuery({
    queryKey: ['my-shipments'],
    queryFn: () => shipmentsApi.myShipments({ limit: 5 }),
  });

  const { data: bookings } = useQuery({
    queryKey: ['shipper-bookings'],
    queryFn: bookingsApi.shipperBookings,
  });

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.me,
    enabled: !!session,
  });

  const profileIncomplete = !!me && (!me.profile?.city || !me.profile?.avatarUrl);

  return (
    <>
      <OnboardingModal role="SHIPPER" profileIncomplete={profileIncomplete} />
    <div>
      <PageHeader
        title={`Welcome back!`}
        description={`Here's what's happening with your shipments.`}
        action={
          <Link href="/shipper/shipments/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Post a Load
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      {statsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Shipments" value={stats?.total ?? 0} icon={Package} />
          <StatCard title="Open / Bidding" value={(stats?.open ?? 0) + (stats?.booked ?? 0)} icon={Clock} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
          <StatCard title="Active Bookings" value={stats?.booked ?? 0} icon={TrendingUp} iconColor="text-purple-600" iconBg="bg-purple-50" />
          <StatCard title="Delivered" value={stats?.delivered ?? 0} icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Shipments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Recent Shipments</h2>
            <Link href="/shipper/shipments">
              <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {shipmentsLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : shipmentsData?.data?.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No shipments yet</div>
            ) : (
              shipmentsData?.data?.map((s: any) => (
                <Link key={s.id} href={`/shipper/shipments/${s.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.pickupCity} → {s.deliveryCity} · {formatDate(s.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{s._count?.bids ?? 0} bids</span>
                    <StatusBadge status={s.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Active Bookings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Active Bookings</h2>
            <Link href="/shipper/bookings">
              <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!bookings?.length ? (
              <div className="p-8 text-center text-gray-400 text-sm">No active bookings</div>
            ) : (
              bookings.slice(0, 5).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{b.shipment?.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Driver: {b.driver?.profile?.firstName} {b.driver?.profile?.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(b.agreedAmount)}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
