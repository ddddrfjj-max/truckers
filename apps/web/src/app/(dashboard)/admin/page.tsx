'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Users, Package, BookOpen, FileText, Truck, TrendingUp, ShieldCheck, AlertCircle, Loader2, ArrowRight, Mail } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
  });

  const { data: pendingDocs } = useQuery({
    queryKey: ['pending-docs'],
    queryFn: adminApi.pendingDocuments,
  });

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Platform overview and management"
      />

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
          <StatCard title="Shippers" value={stats?.totalShippers ?? 0} icon={Package} iconColor="text-blue-600" iconBg="bg-blue-50" />
          <StatCard title="Drivers" value={stats?.totalDrivers ?? 0} icon={Truck} iconColor="text-green-600" iconBg="bg-green-50" />
          <StatCard title="Total Shipments" value={stats?.totalShipments ?? 0} icon={TrendingUp} iconColor="text-purple-600" iconBg="bg-purple-50" />
          <StatCard title="Open Loads" value={stats?.openShipments ?? 0} icon={Package} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
          <StatCard title="Active Bookings" value={stats?.activeBookings ?? 0} icon={BookOpen} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
          <StatCard title="Completed" value={stats?.completedBookings ?? 0} icon={ShieldCheck} iconColor="text-teal-600" iconBg="bg-teal-50" />
          <StatCard
            title="Pending Docs"
            value={stats?.pendingDocuments ?? 0}
            icon={AlertCircle}
            iconColor={stats?.pendingDocuments > 0 ? 'text-red-600' : 'text-gray-400'}
            iconBg={stats?.pendingDocuments > 0 ? 'bg-red-50' : 'bg-gray-50'}
          />
          <StatCard
            title="Unread Messages"
            value={stats?.unreadMessages ?? 0}
            icon={Mail}
            iconColor={stats?.unreadMessages > 0 ? 'text-blue-600' : 'text-gray-400'}
            iconBg={stats?.unreadMessages > 0 ? 'bg-blue-50' : 'bg-gray-50'}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: '/admin/users', label: 'Manage Users', icon: Users, desc: 'View, suspend, or manage all platform users' },
          { href: '/admin/documents', label: 'Review Documents', icon: FileText, desc: `${pendingDocs?.length ?? 0} documents awaiting review`, alert: (pendingDocs?.length ?? 0) > 0 },
          { href: '/admin/drivers', label: 'Driver Verification', icon: ShieldCheck, desc: 'Review and approve driver applications' },
          { href: '/admin/messages', label: 'Contact Messages', icon: Mail, desc: `${stats?.unreadMessages ?? 0} unread message${stats?.unreadMessages !== 1 ? 's' : ''}`, alert: (stats?.unreadMessages ?? 0) > 0 },
          { href: '/admin/shipments', label: 'All Shipments', icon: Package, desc: 'Browse and moderate all shipments' },
          { href: '/admin/bookings', label: 'All Bookings', icon: BookOpen, desc: 'View all active and past bookings' },
        ].map(({ href, label, icon: Icon, desc, alert }) => (
          <Link key={href} href={href}>
            <div className={`bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer ${alert ? 'border-red-200' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <Icon className={`w-5 h-5 ${alert ? 'text-red-600' : 'text-gray-600'}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
