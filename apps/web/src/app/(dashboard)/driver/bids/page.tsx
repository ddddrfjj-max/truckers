'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bidsApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ClipboardList, Loader2, MapPin, ArrowLeftRight, CheckCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function DriverBidsPage() {
  const queryClient = useQueryClient();
  const [counteringBidId, setCounteringBidId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');

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

  const acceptCounterMutation = useMutation({
    mutationFn: bidsApi.acceptCounter,
    onSuccess: () => {
      toast.success('Counter accepted! Booking confirmed.');
      queryClient.invalidateQueries({ queryKey: ['driver-bids'] });
      queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectCounterMutation = useMutation({
    mutationFn: bidsApi.rejectCounter,
    onSuccess: () => {
      toast.success('Counter rejected — your original bid still stands');
      queryClient.invalidateQueries({ queryKey: ['driver-bids'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const counterMutation = useMutation({
    mutationFn: ({ bidId, amount, note }: { bidId: string; amount: number; note?: string }) =>
      bidsApi.counter(bidId, amount, note),
    onSuccess: () => {
      toast.success('Counter offer sent to shipper');
      setCounteringBidId(null);
      setCounterAmount('');
      setCounterNote('');
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
              bid.status === 'COUNTERED' && bid.counterBy === 'SHIPPER' ? 'border-amber-300' :
              bid.shipment?.status === 'CANCELLED' ? 'border-red-100 opacity-75' : 'border-gray-100'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{bid.shipment?.title}</h3>
                    {bid.shipment?.status === 'CANCELLED' && (
                      <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                        Shipment Cancelled
                      </span>
                    )}
                    {bid.status === 'COUNTERED' && bid.counterBy === 'SHIPPER' && (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium animate-pulse">
                        Counter offer received
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
                </div>
              </div>

              {/* Shipper's counter offer */}
              {bid.status === 'COUNTERED' && bid.counterBy === 'SHIPPER' && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
                    <ArrowLeftRight className="w-3 h-3" /> Shipper counter-offered
                  </p>
                  <p className="text-xl font-bold text-amber-900">{formatCurrency(bid.counterAmount)}</p>
                  {bid.counterNote && <p className="text-xs text-amber-800 italic mt-1">"{bid.counterNote}"</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      size="sm"
                      className="gap-1 bg-green-600 hover:bg-green-700"
                      disabled={acceptCounterMutation.isPending}
                      onClick={() => acceptCounterMutation.mutate(bid.id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Accept {formatCurrency(bid.counterAmount)}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      disabled={rejectCounterMutation.isPending}
                      onClick={() => rejectCounterMutation.mutate(bid.id)}
                    >
                      Decline
                    </Button>
                    {counteringBidId !== bid.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => { setCounteringBidId(bid.id); setCounterAmount(''); setCounterNote(''); }}
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" /> Counter Back
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Driver's outgoing counter — awaiting shipper */}
              {bid.status === 'COUNTERED' && bid.counterBy === 'DRIVER' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                    <ArrowLeftRight className="w-3 h-3" /> Your counter — awaiting shipper response
                  </p>
                  <p className="text-lg font-bold text-blue-900 mt-1">{formatCurrency(bid.counterAmount)}</p>
                  {bid.counterNote && <p className="text-xs text-blue-800 italic mt-1">"{bid.counterNote}"</p>}
                </div>
              )}

              {/* Counter-back form */}
              {counteringBidId === bid.id && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" /> Your Counter Offer
                  </p>
                  <div>
                    <Label className="text-xs">Amount (USD)</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <Input type="number" min="1" className="pl-7" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Note (optional)</Label>
                    <Textarea className="mt-1 text-sm" rows={2} placeholder="Explain your counter..." value={counterNote} onChange={(e) => setCounterNote(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!counterAmount || counterMutation.isPending}
                      onClick={() => counterMutation.mutate({ bidId: bid.id, amount: Number(counterAmount), note: counterNote || undefined })}
                    >
                      {counterMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Send Counter
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCounteringBidId(null)}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Standard actions */}
              {bid.status === 'PENDING' && bid.shipment?.status !== 'CANCELLED' && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => withdrawMutation.mutate(bid.id)}
                    disabled={withdrawMutation.isPending}
                  >
                    Withdraw Bid
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
