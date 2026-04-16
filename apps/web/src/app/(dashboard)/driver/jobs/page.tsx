'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { bookingsApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { ChatBox } from '@/components/dashboard/chat-box';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Truck, Loader2, MapPin, ArrowRight, ExternalLink, XCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

const NEXT_STATUS: Record<string, { label: string; status: string }> = {
  CONFIRMED: { label: 'Start Route (En Route)', status: 'DRIVER_EN_ROUTE' },
  DRIVER_EN_ROUTE: { label: 'Mark Picked Up', status: 'IN_TRANSIT' },
  IN_TRANSIT: { label: 'Mark Delivered', status: 'DELIVERED' },
  DELIVERED: { label: 'Complete Job', status: 'COMPLETED' },
};

export default function DriverJobsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['driver-jobs'],
    queryFn: bookingsApi.driverJobs,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      bookingsApi.updateStatus(id, status, notes),
    onSuccess: (_, vars) => {
      if (vars.status === 'CANCELLED') {
        toast.success('Job cancelled.');
        setCancellingId(null);
        setCancelReason('');
      } else {
        toast.success('Job status updated!');
      }
      queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['driver-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="My Jobs" description="Manage your active and past bookings" />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : !jobs?.length ? (
        <EmptyState
          icon={Truck}
          title="No jobs yet"
          description="Once a shipper accepts your bid, your jobs will appear here."
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job: any) => {
            const nextAction = NEXT_STATUS[job.status];
            return (
              <div key={job.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Link
                        href={`/driver/browse/${job.shipmentId}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {job.shipment?.title}
                        <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                      </Link>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.shipment?.pickupCity}, {job.shipment?.pickupState}
                      <ArrowRight className="w-3 h-3 mx-1" />
                      {job.shipment?.deliveryCity}, {job.shipment?.deliveryState}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                      <span>Pickup: {formatDate(job.shipment?.pickupDate)}</span>
                      <span>Shipper: {job.shipment?.shipper?.profile?.firstName} {job.shipment?.shipper?.profile?.lastName}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(job.agreedAmount)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Agreed price</p>
                  </div>
                </div>

                {nextAction && (
                  <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-2 items-start">
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => updateMutation.mutate({ id: job.id, status: nextAction.status })}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending && cancellingId !== job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {nextAction.label}
                    </Button>

                    {/* Driver-side cancel for en-route / in-transit */}
                    {(job.status === 'DRIVER_EN_ROUTE' || job.status === 'IN_TRANSIT') && (
                      cancellingId === job.id ? (
                        <div className="w-full mt-2 space-y-2 bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-sm font-semibold text-red-800">Cancel this job?</p>
                          <p className="text-xs text-red-600">Please provide a reason — the shipper will be notified.</p>
                          <Textarea
                            placeholder="e.g. Vehicle breakdown, personal emergency, route issue..."
                            className="text-sm"
                            rows={3}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              disabled={!cancelReason.trim() || updateMutation.isPending}
                              onClick={() => updateMutation.mutate({ id: job.id, status: 'CANCELLED', notes: cancelReason })}
                            >
                              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Confirm Cancel
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setCancellingId(null); setCancelReason(''); }}>
                              Keep Job
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setCancellingId(job.id)}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel Job
                        </Button>
                      )
                    )}
                  </div>
                )}

                {job.status === 'COMPLETED' && (
                  <div className="mt-3 px-3 py-2 bg-green-50 rounded-lg text-sm text-green-700 font-medium">
                    ✓ Job completed {job.completedAt ? formatDate(job.completedAt) : ''}
                  </div>
                )}

                {job.status === 'CANCELLED' && (
                  <div className="mt-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                    <span className="font-medium">Cancelled</span>
                    {job.cancellationReason && <span> — {job.cancellationReason}</span>}
                    {job.cancelledAt && <span className="text-red-500 ml-1 text-xs">({formatDate(job.cancelledAt)})</span>}
                  </div>
                )}

                {/* Chat — available once booking is confirmed */}
                {session?.user?.id && (
                  <div className="mt-4">
                    <ChatBox bookingId={job.id} currentUserId={session.user.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
