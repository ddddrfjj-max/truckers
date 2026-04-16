'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { bookingsApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { ChatBox } from '@/components/dashboard/chat-box';
import { formatDate, formatCurrency } from '@/lib/utils';
import { BookOpen, Loader2, Truck } from 'lucide-react';

export default function ShipperBookingsPage() {
  const { data: session } = useSession();
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['shipper-bookings'],
    queryFn: bookingsApi.shipperBookings,
  });

  return (
    <div>
      <PageHeader title="Active Bookings" description="Track all your confirmed shipments and chat with drivers" />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : !bookings?.length ? (
        <EmptyState
          icon={BookOpen}
          title="No bookings yet"
          description="Accept a bid on one of your shipments to create a booking."
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b: any) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{b.shipment?.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {b.shipment?.pickupCity} → {b.shipment?.deliveryCity}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      {b.driver?.profile?.firstName} {b.driver?.profile?.lastName}
                    </span>
                    <span className="font-semibold text-gray-900">{formatCurrency(b.agreedAmount)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Booked {formatDate(b.createdAt)}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>

              {session?.user?.id && (
                <ChatBox bookingId={b.id} currentUserId={session.user.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
