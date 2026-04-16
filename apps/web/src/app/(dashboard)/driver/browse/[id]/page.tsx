'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentsApi, bidsApi, usersApi, bookingsApi } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { ChatBox } from '@/components/dashboard/chat-box';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatCurrency, formatWeight } from '@/lib/utils';
import {
  MapPin, Package, Truck, DollarSign, ArrowLeft,
  Loader2, AlertCircle, CheckCircle2, Clock, ImageIcon, ShieldAlert, ShieldCheck, Upload,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [bidAmount, setBidAmount] = useState('');
  const [bidNote, setBidNote] = useState('');
  const [bidSubmitted, setBidSubmitted] = useState(false);

  const { data: shipment, isLoading, isError } = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => shipmentsApi.getOne(id),
  });

  const { data: myBids } = useQuery({
    queryKey: ['driver-bids'],
    queryFn: bidsApi.myBids,
  });

  const { data: driverProfile } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: usersApi.driverProfile,
    retry: false,
  });

  const { data: myJobs } = useQuery({
    queryKey: ['driver-jobs'],
    queryFn: bookingsApi.driverJobs,
  });

  // Find if this driver has an active booking for this shipment
  const myBooking = myJobs?.find((j: any) => j.shipmentId === id);

  const isVerified = driverProfile?.verificationStatus === 'APPROVED';
  const isPending = driverProfile?.verificationStatus === 'PENDING' || driverProfile?.verificationStatus === 'UNDER_REVIEW';
  const existingBid = myBids?.find((b: any) => b.shipmentId === id && b.status === 'PENDING');

  const bidMutation = useMutation({
    mutationFn: () => bidsApi.place({ shipmentId: id, amount: Number(bidAmount), note: bidNote }),
    onSuccess: () => {
      toast.success('Bid placed successfully!');
      setBidSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['driver-bids'] });
      queryClient.invalidateQueries({ queryKey: ['browse-loads'] });
      queryClient.invalidateQueries({ queryKey: ['shipment', id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleBid = () => {
    if (!bidAmount || Number(bidAmount) <= 0) {
      toast.error('Enter a valid bid amount');
      return;
    }
    if (!bidNote.trim()) {
      toast.error('Please add a note to the shipper describing your experience and availability');
      return;
    }
    bidMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !shipment) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600">Shipment not found or no longer available.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const canBid = (shipment.status === 'OPEN' || shipment.status === 'BIDDING') && !existingBid && !bidSubmitted && isVerified;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 text-gray-500">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      <PageHeader
        title={shipment.title}
        description="Shipment details"
        action={<StatusBadge status={shipment.status} />}
      />

      <div className="space-y-4 mt-6">
        {/* Photos */}
        {shipment.images?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-500" /> Photos ({shipment.images.length})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {shipment.images.map((img: any) => (
                <a key={img.id} href={`http://localhost:3002${img.url}`} target="_blank" rel="noreferrer">
                  <img
                    src={`http://localhost:3002${img.url}`}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Route */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" /> Route
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pickup</p>
              {shipment.pickupAddress && <p className="text-sm text-gray-600">{shipment.pickupAddress}</p>}
              <p className="font-semibold text-gray-900">{shipment.pickupCity}, {shipment.pickupState}</p>
              {shipment.pickupZip && <p className="text-xs text-gray-400">{shipment.pickupZip}</p>}
            </div>
            <div className="text-gray-300 text-2xl">→</div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Delivery</p>
              {shipment.deliveryAddress && <p className="text-sm text-gray-600">{shipment.deliveryAddress}</p>}
              <p className="font-semibold text-gray-900">{shipment.deliveryCity}, {shipment.deliveryState}</p>
              {shipment.deliveryZip && <p className="text-xs text-gray-400">{shipment.deliveryZip}</p>}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" /> Cargo Details
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Cargo Type</p>
              <p className="font-medium text-gray-900">{shipment.cargoType?.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Weight</p>
              <p className="font-medium text-gray-900">{formatWeight(shipment.weightKg)}</p>
            </div>
            {shipment.vehicleRequired && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Vehicle Required</p>
                <p className="font-medium text-gray-900">{shipment.vehicleRequired.replace(/_/g, ' ')}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Pickup Date</p>
              <p className="font-medium text-gray-900">{formatDate(shipment.pickupDate)}</p>
            </div>
            {shipment.deliveryDate && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Delivery Deadline</p>
                <p className="font-medium text-gray-900">{formatDate(shipment.deliveryDate)}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Bids So Far</p>
              <p className="font-medium text-gray-900">{shipment._count?.bids ?? 0}</p>
            </div>
          </div>
          {shipment.specialHandling && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 mb-1">Special Handling</p>
              <p className="text-sm text-amber-800">{shipment.specialHandling}</p>
            </div>
          )}
          {shipment.description && (
            <div className="mt-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700">{shipment.description}</p>
            </div>
          )}
        </div>

        {/* Budget */}
        {(shipment.budgetMin || shipment.budgetMax) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" /> Budget
            </h2>
            <div className="flex gap-6">
              {shipment.budgetMin && (
                <div>
                  <p className="text-xs text-gray-400">Minimum</p>
                  <p className="text-lg font-bold text-gray-700">{formatCurrency(shipment.budgetMin)}</p>
                </div>
              )}
              {shipment.budgetMax && (
                <div>
                  <p className="text-xs text-gray-400">Maximum</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(shipment.budgetMax)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shipper info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-500" /> Posted By
          </h2>
          <p className="text-gray-900 font-medium">
            {shipment.shipper?.profile?.firstName} {shipment.shipper?.profile?.lastName}
          </p>
          {shipment.shipper?.profile?.company && (
            <p className="text-sm text-gray-500">{shipment.shipper.profile.company}</p>
          )}
        </div>

        {/* Chat — shown once shipper accepted the driver's bid */}
        {myBooking && session?.user?.id && (
          <ChatBox bookingId={myBooking.id} currentUserId={session.user.id} />
        )}

        {/* Verification banner */}
        {!isVerified && (shipment.status === 'OPEN' || shipment.status === 'BIDDING') && (
          isPending ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">Verification in progress</p>
                <p className="text-sm text-amber-700 mt-0.5">Your documents are being reviewed. You'll be able to place bids once approved.</p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">Verification required to place bids</p>
                <p className="text-sm text-red-700 mt-0.5 mb-3">Upload your driver's license and vehicle documents to get verified.</p>
                <Link href="/driver/documents">
                  <button className="inline-flex items-center gap-2 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Upload Documents
                  </button>
                </Link>
              </div>
            </div>
          )
        )}

        {/* Bid form / status */}
        {existingBid ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">You have an active bid of {formatCurrency(existingBid.amount)}</p>
              <p className="text-sm text-green-700 mt-0.5">Go to My Bids to track or withdraw it.</p>
            </div>
          </div>
        ) : bidSubmitted ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <p className="font-semibold text-green-800">Bid submitted! The shipper will review your offer.</p>
          </div>
        ) : canBid ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" /> Place Your Bid
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Your Bid Amount (USD) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  placeholder={shipment.budgetMax ? String(Math.round(shipment.budgetMax * 0.85)) : '750'}
                  className="mt-1"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
                {shipment.budgetMax && (
                  <p className="text-xs text-gray-400 mt-1">Shipper budget: {formatCurrency(shipment.budgetMax)}</p>
                )}
              </div>
              <div>
                <Label htmlFor="note">Note to Shipper <span className="text-red-500">*</span></Label>
                <Textarea
                  id="note"
                  className="mt-1"
                  placeholder="Introduce yourself — describe your driving experience, how many similar loads you've handled, your vehicle specs, and when you're available for pickup. A strong note greatly improves your chances of being selected."
                  value={bidNote}
                  onChange={(e) => setBidNote(e.target.value)}
                  required
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleBid}
                disabled={bidMutation.isPending}
              >
                {bidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                Submit Bid
              </Button>
            </div>
          </div>
        ) : shipment.status === 'BOOKED' || shipment.status === 'IN_TRANSIT' ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-gray-600">This shipment has already been booked and is no longer accepting bids.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
