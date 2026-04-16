'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, ShieldX, Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: 'All Drivers' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'NOT_SUBMITTED', label: 'Not Submitted' },
];

const DOC_LABELS: Record<string, string> = {
  DRIVERS_LICENSE_FRONT: "License (Front)",
  DRIVERS_LICENSE_BACK: "License (Back)",
  VEHICLE_REGISTRATION: 'Registration',
  VEHICLE_INSURANCE: 'Insurance',
  PROFILE_PHOTO: 'Profile Photo',
};

export default function AdminDriversPage() {
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-drivers', filter],
    queryFn: () => adminApi.driversForVerification({ verificationStatus: filter, limit: 100 }),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ driverId, status, notes }: { driverId: string; status: string; notes?: string }) =>
      adminApi.updateDriverVerification(driverId, status, notes),
    onSuccess: (_, vars) => {
      toast.success(`Driver ${vars.status === 'APPROVED' ? 'approved' : vars.status === 'REJECTED' ? 'rejected' : 'updated'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const needsReview = data?.data?.filter((d: any) =>
    ['PENDING', 'UNDER_REVIEW'].includes(d.driverProfile?.verificationStatus ?? '')
  ).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Driver Verification"
        description={`${data?.total ?? 0} drivers · ${needsReview} awaiting review`}
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
              filter === f.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : !data?.data?.length ? (
        <p className="text-center text-gray-400 py-16">No drivers found</p>
      ) : (
        <div className="space-y-3">
          {data.data.map((driver: any) => {
            const vs = driver.driverProfile?.verificationStatus ?? 'NOT_SUBMITTED';
            const isOpen = expanded === driver.id;
            const mutating = verifyMutation.isPending && (verifyMutation.variables as any)?.driverId === driver.id;

            return (
              <div
                key={driver.id}
                className={cn(
                  'bg-white rounded-xl border shadow-sm overflow-hidden',
                  (vs === 'PENDING' || vs === 'UNDER_REVIEW') ? 'border-amber-200' : 'border-gray-100',
                )}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-gray-900">
                          {driver.profile?.firstName} {driver.profile?.lastName}
                        </h3>
                        <StatusBadge status={vs} />
                        {(vs === 'PENDING' || vs === 'UNDER_REVIEW') && (
                          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                            Needs Review
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{driver.email}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                        {driver.driverProfile?.vehicleType && (
                          <span>{driver.driverProfile.vehicleType.replace(/_/g, ' ')}</span>
                        )}
                        {driver.driverProfile?.vehicleMake && (
                          <span>{driver.driverProfile.vehicleMake} {driver.driverProfile.vehicleModel} {driver.driverProfile.vehicleYear}</span>
                        )}
                        <span>{driver.documents?.length ?? 0} docs</span>
                        <span>Joined {formatDate(driver.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {vs !== 'APPROVED' && (
                        <Button
                          size="sm"
                          className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                          disabled={mutating}
                          onClick={() => verifyMutation.mutate({ driverId: driver.id, status: 'APPROVED' })}
                        >
                          {mutating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          Approve
                        </Button>
                      )}
                      {vs !== 'REJECTED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                          disabled={mutating}
                          onClick={() => verifyMutation.mutate({ driverId: driver.id, status: 'REJECTED', notes: 'Rejected by admin' })}
                        >
                          {mutating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldX className="w-3.5 h-3.5" />}
                          Reject
                        </Button>
                      )}
                      {vs === 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-600 border-amber-200 hover:bg-amber-50"
                          disabled={mutating}
                          onClick={() => verifyMutation.mutate({ driverId: driver.id, status: 'UNDER_REVIEW', notes: 'Revoked by admin' })}
                        >
                          Revoke
                        </Button>
                      )}
                      <button
                        onClick={() => setExpanded(isOpen ? null : driver.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Documents
                    </h4>
                    {!driver.documents?.length ? (
                      <p className="text-sm text-gray-400">No documents uploaded</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {driver.documents.map((doc: any) => (
                          <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {DOC_LABELS[doc.type] ?? doc.type.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-gray-400">{formatDate(doc.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={doc.status} />
                              <a
                                href={`http://localhost:3002${doc.url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline font-medium"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {driver.driverProfile?.verificationNotes && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
                        <span className="font-semibold">Notes: </span>{driver.driverProfile.verificationNotes}
                      </div>
                    )}
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
