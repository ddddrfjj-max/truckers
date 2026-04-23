'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi, usersApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';
import {
  Upload, FileText, Loader2, CheckCircle, AlertCircle, Clock,
  Camera, CreditCard, Eye, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { toast } from 'sonner';

const DOCUMENT_TYPES = [
  { value: 'DRIVERS_LICENSE_FRONT', label: "Driver's License (Front)", isLicense: true, required: true },
  { value: 'DRIVERS_LICENSE_BACK', label: "Driver's License (Back)", isLicense: true, required: false },
  { value: 'VEHICLE_REGISTRATION', label: 'Vehicle Registration', isLicense: false, required: true },
  { value: 'INSURANCE_CERTIFICATE', label: 'Insurance Certificate', isLicense: false, required: true },
  { value: 'PROFILE_PHOTO', label: 'Profile Photo', isLicense: false, required: false },
  { value: 'OTHER', label: 'Other', isLicense: false, required: false },
];

/** Apply a semi-transparent diagonal watermark to an image and return a watermarked Blob */
async function applyWatermark(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Watermark settings
      const text = 'FREIGHTFLOW — VERIFIED COPY';
      const fontSize = Math.max(16, Math.round(img.width / 25));
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(30, 80, 200, 0.28)';
      ctx.strokeStyle = 'rgba(30, 80, 200, 0.12)';
      ctx.lineWidth = 1;

      // Rotate and tile the watermark diagonally
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      const step = fontSize * 4.5;
      for (let y = -canvas.height; y < canvas.height; y += step) {
        for (let x = -canvas.width; x < canvas.width; x += step * 1.8) {
          ctx.fillText(text, x, y);
          ctx.strokeText(text, x, y);
        }
      }
      ctx.restore();

      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const watermarked = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
            });
            resolve(watermarked);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.92,
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('DRIVERS_LICENSE_FRONT');
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const [licenseData, setLicenseData] = useState({ number: '', expiry: '', state: '', fullName: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: docs, isLoading } = useQuery({
    queryKey: ['my-documents'],
    queryFn: documentsApi.myDocuments,
  });

  const { data: driverProfile } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: usersApi.driverProfile,
    retry: false,
  });

  const verificationStatus = driverProfile?.verificationStatus ?? 'NOT_SUBMITTED';
  const selectedDocType = DOCUMENT_TYPES.find((t) => t.value === selectedType);
  const isLicenseType = selectedDocType?.isLicense ?? false;

  const uploadMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) =>
      documentsApi.upload(file, type),
    onSuccess: () => {
      toast.success('Document uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      setPreview(null);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = '';
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => usersApi.updateDriverProfile(data),
    onSuccess: () => {
      toast.success('License information saved!');
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      setShowLicenseForm(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      toast.success('Document removed');
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For image files, show preview and apply watermark before upload
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setPendingFile(file);
    } else {
      // PDFs — upload directly
      uploadMutation.mutate({ file, type: selectedType });
    }
  }, [selectedType]);

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    let fileToUpload = pendingFile;

    if (isLicenseType) {
      fileToUpload = await applyWatermark(pendingFile);
    }

    uploadMutation.mutate({ file: fileToUpload, type: selectedType });
  };

  const bannerConfig = {
    APPROVED: {
      bg: 'bg-green-50 text-green-700 border-green-200',
      icon: <CheckCircle className="w-5 h-5 shrink-0" />,
      title: 'Account Verified!',
      body: 'Your documents have been reviewed and approved. You can now bid on loads.',
    },
    PENDING: {
      bg: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      icon: <Clock className="w-5 h-5 shrink-0" />,
      title: 'Verification Pending',
      body: 'Your documents have been submitted and are awaiting review. This typically takes 1–2 business days.',
    },
    UNDER_REVIEW: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Clock className="w-5 h-5 shrink-0" />,
      title: 'Under Review',
      body: 'An admin is currently reviewing your documents. You\'ll be notified once a decision is made.',
    },
    REJECTED: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      icon: <AlertCircle className="w-5 h-5 shrink-0" />,
      title: 'Verification Rejected',
      body: driverProfile?.verificationNotes
        ? `Reason: ${driverProfile.verificationNotes}. Please re-upload the required documents.`
        : 'Your verification was rejected. Please re-upload your documents.',
    },
  } as Record<string, { bg: string; icon: React.ReactNode; title: string; body: string }>;

  const banner = verificationStatus !== 'NOT_SUBMITTED' ? bannerConfig[verificationStatus] : null;

  return (
    <div>
      <PageHeader
        title="Verification Documents"
        description="Upload required documents to get verified and start bidding on loads"
      />

      {/* Status Banner */}
      {banner && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${banner.bg}`}>
          {banner.icon}
          <div>
            <p className="font-semibold">{banner.title}</p>
            <p className="text-sm opacity-80">{banner.body}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Panel */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="w-4 h-4 text-blue-500" /> Upload Document</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Type selector */}
            <div className="space-y-2">
              <Label>Document Type <span className="text-red-500">*</span></Label>
              <select
                className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setPreview(null); setPendingFile(null); }}
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}{t.required ? ' (required)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* License guide tip */}
            {isLicenseType && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2 text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Place your license flat on a dark surface in good lighting. Ensure all four corners are visible and text is sharp.
                  A <strong>FreightFlow watermark</strong> will be applied automatically to prevent misuse.
                </span>
              </div>
            )}

            {/* Preview + Frame overlay */}
            {preview ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border-2 border-blue-400 shadow-md bg-gray-900">
                  {/* Frame guide overlay */}
                  {isLicenseType && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                      <div className="w-[90%] h-[80%] border-2 border-dashed border-white/60 rounded-lg flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl-md" />
                        <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr-md" />
                        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl-md" />
                        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-white rounded-br-md" />
                        <CreditCard className="w-8 h-8 text-white/30" />
                      </div>
                      {/* Watermark preview text */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p
                          className="text-white/25 font-bold text-sm tracking-widest select-none"
                          style={{ transform: 'rotate(-20deg)', whiteSpace: 'nowrap', fontSize: 'clamp(10px, 2vw, 16px)' }}
                        >
                          FREIGHTFLOW — VERIFIED COPY
                        </p>
                      </div>
                    </div>
                  )}
                  <img src={preview} alt="Preview" className="w-full object-cover max-h-64" />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleConfirmUpload}
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                      : <><Upload className="w-4 h-4" /> Confirm & Upload</>}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setPreview(null); setPendingFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  >
                    Retake
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                ) : (
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                )}
                <p className="text-sm font-medium text-gray-700">
                  {uploadMutation.isPending ? 'Uploading...' : 'Click to upload or take a photo'}
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP or PDF — up to 10 MB</p>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <p className="text-xs text-gray-500">
              <strong>Required:</strong> Driver's License (front) · Vehicle Registration · Insurance Certificate
            </p>
          </CardContent>
        </Card>

        {/* License Data Extraction */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowLicenseForm(!showLicenseForm)}
              >
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="w-4 h-4 text-blue-500" /> License Information
                  <span className="text-xs font-normal text-gray-400 ml-1">for contract creation</span>
                </CardTitle>
                {showLicenseForm ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
            </CardHeader>
            {showLicenseForm && (
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-500">
                  Enter the key details from your driver's license. This information will be used to pre-fill future contracts.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">License Number</Label>
                    <Input
                      placeholder="e.g. D1234567"
                      className="h-9 text-sm"
                      value={licenseData.number}
                      onChange={(e) => setLicenseData((p) => ({ ...p, number: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Expiry Date</Label>
                    <Input
                      type="date"
                      className="h-9 text-sm"
                      value={licenseData.expiry}
                      onChange={(e) => setLicenseData((p) => ({ ...p, expiry: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Issuing State</Label>
                    <Input
                      placeholder="e.g. IL"
                      className="h-9 text-sm"
                      maxLength={3}
                      value={licenseData.state}
                      onChange={(e) => setLicenseData((p) => ({ ...p, state: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Full Name on License</Label>
                    <Input
                      placeholder="As printed on license"
                      className="h-9 text-sm"
                      value={licenseData.fullName}
                      onChange={(e) => setLicenseData((p) => ({ ...p, fullName: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full gap-2"
                  disabled={updateProfileMutation.isPending || (!licenseData.number && !licenseData.expiry)}
                  onClick={() => updateProfileMutation.mutate({
                    licenseNumber: licenseData.number || undefined,
                    licenseExpiry: licenseData.expiry ? new Date(licenseData.expiry).toISOString() : undefined,
                  })}
                >
                  {updateProfileMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save License Info
                </Button>

                {/* Pre-filled from existing profile */}
                {(driverProfile?.licenseNumber || driverProfile?.licenseExpiry) && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg text-xs text-green-700">
                    <strong>Saved:</strong>{' '}
                    {driverProfile.licenseNumber && <>License #{driverProfile.licenseNumber}</>}
                    {driverProfile.licenseExpiry && (
                      <>, expires {new Date(driverProfile.licenseExpiry).toLocaleDateString()}</>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Uploaded Documents */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="w-4 h-4 text-blue-500" /> Uploaded Documents ({docs?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : !docs?.length ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(doc.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <StatusBadge status={doc.status} />
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-400 hover:text-blue-500"
                          title="View document"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        {doc.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 text-xs px-2"
                            onClick={() => deleteMutation.mutate(doc.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
