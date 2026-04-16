'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bidsApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ClipboardList, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function DriverBidsPage() {
  const queryClient = useQueryClient();

  const { data: bids, isLoading } = useQuery({
    queryKey: ['driver-bids'],
    queryFn: bidsApi.myBids,
  });

  const withdrawMutation = useMutation({
    mutationFn: bidsApi.withdraw,
    onSuccess: () => {
      toast.success('Bid withdrawn');
      queryClient.invalidateQueries({ queryKey: ['driver-bids'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="My Bids" description="Track all bids you've placed on shipments" />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : !bids?.length ? (
        <EmptyState
          icon={ClipboardList}
          title="No bids yet"
          description="Browse available loads and place your first bid"
        />
      ) : (
        <div className="space-y-3">
          {bids.map((bid: any) => (
            <div key={bid.id} className={`bg-white rounded-xl border shadow-sm p-5 ${
              bid.shipment?.status === 'CANCELLED' ? 'border-red-100 opacity-75' : 'border-gray-100'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{bid.shipment?.title}</h3>
                    {bid.shipment?.status === 'CANCELLED' && (
                      <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                        Shipment Cancelled by Shipper
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {bid.shipment?.pickupCity} → {bid.shipment?.deliveryCity}
                  </div>
                  {bid.note && (
                    <p className="text-sm text-gray-600 italic mt-2">"{bid.note}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Submitted {formatDate(bid.createdAt)}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(bid.amount)}</p>
                  <StatusBadge status={bid.status} className="mt-1" />
                  {bid.status === 'PENDING' && bid.shipment?.status !== 'CANCELLED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => withdrawMutation.mutate(bid.id)}
                      disabled={withdrawMutation.isPending}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
