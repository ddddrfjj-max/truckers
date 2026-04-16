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
  Upload, FileText, Loader2, CheckCircle, Clock, AlertCircle,
  Camera, CreditCard, Eye, Info, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

const SHIPPER_DOCUMENT_TYPES = [
  { value: 'GOVERNMENT_ID', label: 'Government-issued ID', isIdDoc: true, required: true,
    hint: 'Passport, national ID card, or driver\'s license. All four corners must be visible.' },
  { value: 'BUSINESS_LICENSE', label: 'Business Registration / License', isIdDoc: false, required: false,
    hint: 'Optional but recommended for business accounts.' },
  { value: 'PROFILE_PHOTO', label: 'Profile Photo', isIdDoc: false, required: false,
    hint: 'A clear headshot helps drivers trust you.' },
  { value: 'OTHER', label: 'Other Supporting Document', isIdDoc: false, required: false, hint: '' },
];

/** Apply watermark to an image and return a watermarked File */
async function applyWatermark(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const text = 'FREIGHTFLOW — VERIFIED COPY';
      const fontSize = Math.max(16, Math.round(img.width / 25));
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(30, 80, 200, 0.28)';
      ctx.strokeStyle = 'rgba(30, 80, 200, 0.12)';
      ctx.lineWidth = 1;

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
          if (blob) resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          else resolve(file);
        },
        'image/jpeg', 0.92,
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

export default function ShipperVerifyPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('GOVERNMENT_ID');
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [idInfo, setIdInfo] = useState({ fullName: '', idNumber: '', expiry: '', issuingCountry: 'US' });
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: docs, isLoading } = useQuery({
    queryKey: ['my-documents'],
    queryFn: documentsApi.myDocuments,
  });

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.me,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) => documentsApi.upload(file, type),
    onSuccess: () => {
      toast.success('Document uploaded! Our team will review it within 1–2 business days.');
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      setPreview(null);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = '';
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

  const selectedDocType = SHIPPER_DOCUMENT_TYPES.find((t) => t.value === selectedType);
  const isIdDoc = selectedDocType?.isIdDoc ?? false;

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
      setPendingFile(file);
    } else {
      uploadMutation.mutate({ file, type: selectedType });
    }
  }, [selectedType]);

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    const fileToUpload = isIdDoc ? await applyWatermark(pendingFile) : pendingFile;
    uploadMutation.mutate({ file: fileToUpload, type: selectedType });
  };

  const shipperDocs = docs?.filter((d: any) =>
    ['GOVERNMENT_ID', 'BUSINESS_LICENSE', 'PROFILE_PHOTO', 'OTHER'].includes(d.type),
  ) ?? [];

  const hasGovId = shipperDocs.some((d: any) => d.type === 'GOVERNMENT_ID');
  const allApproved = hasGovId && shipperDocs.filter((d: any) => d.type === 'GOVERNMENT_ID').every((d: any) => d.status === 'APPROVED');

  return (
    <div>
      <PageHeader
        title="Identity Verification"
        description="Verify your identity to build trust with drivers and unlock all platform features"
      />

      {/* Status banner */}
      {allApproved ? (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-green-50 border border-green-200 text-green-700">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Identity Verified</p>
            <p className="text-sm opacity-80">Your identity has been confirmed. Drivers can see your verified badge.</p>
          </div>
        </div>
      ) : hasGovId ? (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-yellow-50 border border-yellow-200 text-yellow-700">
          <Clock className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Under Review</p>
            <p className="text-sm opacity-80">Your documents have been submitted and are awaiting admin review (1–2 business days).</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-700">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Verification recommended</p>
            <p className="text-sm opacity-80">
              Uploading a government-issued ID helps build trust with drivers and is required to use premium platform features.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-500" /> Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type selector */}
            <div className="space-y-2">
              <Label>Document Type <span className="text-red-500">*</span></Label>
              <select
                className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setPreview(null); setPendingFile(null); }}
              >
                {SHIPPER_DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}{t.required ? ' (required)' : ' (optional)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Hint */}
            {selectedDocType?.hint && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2 text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{selectedDocType.hint}</span>
              </div>
            )}

            {/* Preview + frame */}
            {preview ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border-2 border-blue-400 shadow-md bg-gray-900">
                  {isIdDoc && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                      <div className="w-[88%] h-[78%] border-2 border-dashed border-white/60 rounded-lg flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl-md" />
                        <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr-md" />
                        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl-md" />
                        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-white rounded-br-md" />
                        <CreditCard className="w-8 h-8 text-white/20" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p
                          className="text-white/25 font-bold tracking-widest select-none"
                          style={{ transform: 'rotate(-20deg)', whiteSpace: 'nowrap', fontSize: 'clamp(10px, 2vw, 15px)' }}
                        >
                          FREIGHTFLOW — VERIFIED COPY
                        </p>
                      </div>
                    </div>
                  )}
                  <img src={preview} alt="Preview" className="w-full object-cover max-h-60" />
                </div>

                {/* ID data entry */}
                {isIdDoc && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Enter key info from your ID (for contracts)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Full Name</Label>
                        <Input placeholder="As on ID" className="h-8 text-xs" value={idInfo.fullName}
                          onChange={(e) => setIdInfo((p) => ({ ...p, fullName: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">ID / Passport Number</Label>
                        <Input placeholder="Document number" className="h-8 text-xs" value={idInfo.idNumber}
                          onChange={(e) => setIdInfo((p) => ({ ...p, idNumber: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Expiry Date</Label>
                        <Input type="date" className="h-8 text-xs" value={idInfo.expiry}
                          onChange={(e) => setIdInfo((p) => ({ ...p, expiry: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Issuing Country</Label>
                        <Input placeholder="US" maxLength={3} className="h-8 text-xs" value={idInfo.issuingCountry}
                          onChange={(e) => setIdInfo((p) => ({ ...p, issuingCountry: e.target.value.toUpperCase() }))} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1 gap-2" onClick={handleConfirmUpload} disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                      : <><Upload className="w-4 h-4" /> Confirm & Upload</>}
                  </Button>
                  <Button variant="outline" onClick={() => { setPreview(null); setPendingFile(null); if (fileRef.current) fileRef.current.value = ''; }}>
                    Retake
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Click to upload or take a photo</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP or PDF — up to 10 MB</p>
              </div>
            )}

            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />
          </CardContent>
        </Card>

        {/* Uploaded documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-blue-500" /> Uploaded Documents ({shipperDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : !shipperDocs.length ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shipperDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {SHIPPER_DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(doc.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <StatusBadge status={doc.status} />
                      <a href={`http://localhost:3002${doc.url}`} target="_blank" rel="noreferrer"
                        className="text-gray-400 hover:text-blue-500" title="View">
                        <Eye className="w-4 h-4" />
                      </a>
                      {doc.status === 'PENDING' && (
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 text-xs px-2"
                          onClick={() => deleteMutation.mutate(doc.id)}>
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
  );
}
