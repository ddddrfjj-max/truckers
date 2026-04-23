'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { FileText, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';


const DOC_LABELS: Record<string, string> = {
  DRIVERS_LICENSE_FRONT: "Driver's License (Front)",
  DRIVERS_LICENSE_BACK: "Driver's License (Back)",
  VEHICLE_REGISTRATION: 'Vehicle Registration',
  INSURANCE_CERTIFICATE: 'Insurance Certificate',
  PROFILE_PHOTO: 'Profile Photo',
  OTHER: 'Other',
};

export default function AdminDocumentsPage() {
  const queryClient = useQueryClient();

  const { data: docs, isLoading } = useQuery({
    queryKey: ['admin-pending-docs'],
    queryFn: adminApi.pendingDocuments,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ docId, status }: { docId: string; status: string }) =>
      adminApi.reviewDocument(docId, status),
    onSuccess: (_, vars) => {
      toast.success(`Document ${vars.status === 'APPROVED' ? 'approved' : 'rejected'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-pending-docs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Document Review" description={`${docs?.length ?? 0} documents pending review`} />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : !docs?.length ? (
        <EmptyState
          icon={FileText}
          title="All caught up!"
          description="No documents are waiting for review."
        />
      ) : (
        <div className="space-y-4">
          {docs.map((doc: any) => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  {doc.mimeType?.startsWith('image/') ? (
                    <img
                      src={doc.url}
                      alt="document"
                      className="w-20 h-16 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">
                        {doc.user?.profile?.firstName} {doc.user?.profile?.lastName}
                      </p>
                      <StatusBadge status={doc.user?.driverProfile?.verificationStatus ?? 'PENDING'} />
                    </div>
                    <p className="text-sm text-gray-600">{DOC_LABELS[doc.type] ?? doc.type}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {doc.user?.email} · {formatDate(doc.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400">{doc.filename}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <StatusBadge status={doc.status} />
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 gap-1"
                    onClick={() => reviewMutation.mutate({ docId: doc.id, status: 'APPROVED' })}
                    disabled={reviewMutation.isPending}
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                    onClick={() => reviewMutation.mutate({ docId: doc.id, status: 'REJECTED' })}
                    disabled={reviewMutation.isPending}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
