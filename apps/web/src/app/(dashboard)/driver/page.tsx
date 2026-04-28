'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { bookingsApi, bidsApi, shipmentsApi, usersApi } from '@/lib/api';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { OnboardingModal } from '@/components/onboarding-modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Truck, Search, ClipboardList, CheckCircle, Clock, Loader2, ArrowRight, TrendingUp } from 'lucide-react';

export default function DriverDashboard() {
  const { data: session } = useSession();
  const { data: stats } = useQuery({ queryKey: ['driver-stats'], queryFn: bookingsApi.driverStats });
  const { data: recentJobs } = useQuery({ queryKey: ['driver-jobs'], queryFn: bookingsApi.driverJobs });
  const { data: recentBids } = useQuery({ queryKey: ['driver-bids'], queryFn: bidsApi.myBids });
  const { data: loads } = useQuery({ queryKey: ['browse-loads'], queryFn: () => shipmentsApi.browse({ limit: 5 }) });
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: usersApi.me, enabled: !!session });

  const profileIncomplete = !!me && (!me.profile?.city || !me.profile?.avatarUrl);

  return (
    <>
      <OnboardingModal role="DRIVER" profileIncomplete={profileIncomplete} />
    <div>
      <PageHeader
        title="Driver Dashboard"
        description="Find loads and manage your jobs"
        action={
          <Link href="/driver/browse">
            <Button className="gap-2"><Search className="w-4 h-4" /> Browse Loads</Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Jobs" value={stats?.total ?? 0} icon={Truck} />
        <StatCard title="Active Jobs" value={stats?.active ?? 0} icon={Clock} iconColor="text-orange-600" iconBg="bg-orange-50" />
        <StatCard title="Completed" value={stats?.completed ?? 0} icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="My Bids" value={recentBids?.length ?? 0} icon={ClipboardList} iconColor="text-purple-600" iconBg="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Loads */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Available Loads Nearby</h2>
            <Link href="/driver/browse">
              <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                Browse all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!loads?.data?.length ? (
              <div className="p-8 text-center text-gray-400 text-sm">No loads available right now</div>
            ) : (
              loads.data.slice(0, 5).map((s: any) => (
                <Link key={s.id} href={`/driver/browse/${s.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.pickupCity} → {s.deliveryCity}</p>
                  </div>
                  <div className="text-right">
                    {s.budgetMax && <p className="text-sm font-semibold text-green-600">{formatCurrency(s.budgetMax)}</p>}
                    <StatusBadge status={s.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Active Jobs</h2>
            <Link href="/driver/jobs">
              <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!recentJobs?.length ? (
              <div className="p-8 text-center text-gray-400 text-sm">No active jobs</div>
            ) : (
              recentJobs.slice(0, 5).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{b.shipment?.title}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(b.agreedAmount)}</p>
                  </div>
                  <StatusBadge status={b.status} />
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
