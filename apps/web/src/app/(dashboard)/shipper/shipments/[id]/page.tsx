'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { shipmentsApi, bidsApi, usersApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChatBox } from '@/components/dashboard/chat-box';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatCurrency, formatWeight } from '@/lib/utils';
import { MapPin, Package, Loader2, ArrowLeft, CheckCircle, Star, Truck, Clock, ImageIcon, Plus, X, ShieldCheck, FileText, User, MessageCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingDriverId, setViewingDriverId] = useState<string | null>(null);

  const { data: shipment, isLoading } = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => shipmentsApi.getOne(id),
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => shipmentsApi.uploadImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment', id] });
      toast.success('Photo added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => shipmentsApi.deleteImage(id, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment', id] });
      toast.success('Photo removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const acceptMutation = useMutation({
    mutationFn: (bidId: string) => bidsApi.accept(bidId),
    onSuccess: () => {
      toast.success('Bid accepted! Booking created.');
      queryClient.invalidateQueries({ queryKey: ['shipment', id] });
      queryClient.invalidateQueries({ queryKey: ['my-shipments'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: () => shipmentsApi.cancel(id),
    onSuccess: () => {
      toast.success('Shipment cancelled');
      router.push('/shipper/shipments');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: viewingDriver, isLoading: loadingDriver } = useQuery({
    queryKey: ['driver-public', viewingDriverId],
    queryFn: () => usersApi.publicDriverProfile(viewingDriverId!),
    enabled: !!viewingDriverId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!shipment) return <div className="text-center py-16 text-gray-500">Shipment not found</div>;

  const canAcceptBids = ['OPEN', 'BIDDING'].includes(shipment.status);
  const bookingStatus = shipment.booking?.status;
  const enRouteOrLater = ['DRIVER_EN_ROUTE', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(bookingStatus || '');
  const canCancel = !['CANCELLED', 'DELIVERED', 'IN_TRANSIT'].includes(shipment.status) && !enRouteOrLater;

  return (
    <div>
      <PageHeader
        title={shipment.title}
        description={`Posted ${formatDate(shipment.createdAt)}`}
        action={
          <div className="flex gap-2">
            <Link href="/shipper/shipments">
              <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
            </Link>
            {canCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                Cancel Shipment
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Shipment info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Status</CardTitle></CardHeader>
            <CardContent>
              <StatusBadge status={shipment.status} className="text-sm px-3 py-1" />
              {shipment.booking && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-semibold text-green-700">Booking Confirmed</p>
                  <p className="text-sm text-green-600">
                    Driver: {shipment.booking.driver?.profile?.firstName} {shipment.booking.driver?.profile?.lastName}
                  </p>
                  <p className="text-sm text-green-600">
                    Amount: {formatCurrency(shipment.booking.agreedAmount)}
                  </p>
                  <StatusBadge status={shipment.booking.status} className="mt-2" />
                </div>
              )}
              {shipment.booking && session?.user?.id && (
                <div className="mt-3">
                  <ChatBox bookingId={shipment.booking.id} currentUserId={session.user.id} />
                </div>
              )}
            </CardContent>
          </Card>

          {enRouteOrLater && !['CANCELLED', 'DELIVERED', 'COMPLETED'].includes(bookingStatus || '') && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Driver is en route</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Cancellation is no longer available from your side once the driver has started the route.
                  To cancel, please contact the driver via chat and ask them to initiate the cancellation.
                </p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Route</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Pickup</p>
                  <p className="text-sm font-medium">{shipment.pickupAddress}</p>
                  <p className="text-sm text-gray-600">{shipment.pickupCity}, {shipment.pickupState}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> {formatDate(shipment.pickupDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Delivery</p>
                  <p className="text-sm font-medium">{shipment.deliveryAddress}</p>
                  <p className="text-sm text-gray-600">{shipment.deliveryCity}, {shipment.deliveryState}</p>
                  {shipment.deliveryDate && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {formatDate(shipment.deliveryDate)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Cargo Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium">{shipment.cargoType.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Weight</span>
                <span className="font-medium">{formatWeight(shipment.weightKg)}</span>
              </div>
              {shipment.budgetMin && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium">{formatCurrency(shipment.budgetMin)} – {formatCurrency(shipment.budgetMax ?? 0)}</span>
                </div>
              )}
              {shipment.vehicleRequired && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Vehicle</span>
                  <span className="font-medium">{shipment.vehicleRequired.replace(/_/g, ' ')}</span>
                </div>
              )}
              {shipment.specialHandling && (
                <div>
                  <span className="text-gray-500">Special Handling</span>
                  <p className="text-gray-700 text-xs mt-1">{shipment.specialHandling}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Photos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Photos ({shipment.images?.length ?? 0}/8)
              </CardTitle>
              {(shipment.images?.length ?? 0) < 8 && canCancel && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadImageMutation.isPending}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {uploadImageMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Add photo
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImageMutation.mutate(file);
                  e.target.value = '';
                }}
              />
            </CardHeader>
            <CardContent>
              {!shipment.images?.length ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canCancel}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg p-5 text-center text-gray-400 text-xs hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                  <ImageIcon className="w-5 h-5 mx-auto mb-1" />
                  Add photos
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {shipment.images.map((img: any) => (
                    <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden border border-gray-200">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => deleteImageMutation.mutate(img.id)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Bids */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Bids ({shipment.bids?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!shipment.bids?.length ? (
                <div className="text-center py-12 text-gray-400">
                  <Truck className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">No bids yet</p>
                  <p className="text-sm">Drivers will start bidding once your shipment is visible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shipment.bids.map((bid: any) => (
                    <div
                      key={bid.id}
                      className={`border rounded-xl p-4 ${bid.status === 'ACCEPTED' ? 'border-green-300 bg-green-50' : 'border-gray-100'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-gray-600">
                            {bid.driver?.profile?.firstName?.[0]}{bid.driver?.profile?.lastName?.[0]}
                          </div>
                          <div>
                            <button
                              onClick={() => setViewingDriverId(bid.driver?.id)}
                              className="font-semibold text-gray-900 hover:text-blue-600 hover:underline text-left"
                            >
                              {bid.driver?.profile?.firstName} {bid.driver?.profile?.lastName}
                            </button>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              {bid.driver?.driverProfile?.rating > 0 && (
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                  {bid.driver.driverProfile.rating.toFixed(1)}
                                </span>
                              )}
                              {bid.driver?.driverProfile?.vehicleType && (
                                <span>{bid.driver.driverProfile.vehicleType.replace(/_/g, ' ')}</span>
                              )}
                              {bid.driver?.driverProfile?.totalTrips > 0 && (
                                <span>{bid.driver.driverProfile.totalTrips} trips</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(bid.amount)}</p>
                          <StatusBadge status={bid.status} className="mt-1" />
                        </div>
                      </div>
                      {bid.note && (
                        <p className="text-sm text-gray-600 mt-3 italic">"{bid.note}"</p>
                      )}
                      {bid.estimatedDeliveryDate && (
                        <p className="text-xs text-gray-500 mt-2">
                          Est. delivery: {formatDate(bid.estimatedDeliveryDate)}
                        </p>
                      )}
                      {canAcceptBids && bid.status === 'PENDING' && (
                        <div className="mt-4">
                          <Button
                            size="sm"
                            className="gap-2 bg-green-600 hover:bg-green-700"
                            onClick={() => acceptMutation.mutate(bid.id)}
                            disabled={acceptMutation.isPending}
                          >
                            {acceptMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Accept This Bid
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Driver profile modal */}
      <Dialog open={!!viewingDriverId} onOpenChange={(open) => { if (!open) setViewingDriverId(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Driver Profile</DialogTitle>
          </DialogHeader>
          {loadingDriver ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : viewingDriver ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600">
                  {viewingDriver.profile?.firstName?.[0]}{viewingDriver.profile?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {viewingDriver.profile?.firstName} {viewingDriver.profile?.lastName}
                  </p>
                  {viewingDriver.profile?.city && (
                    <p className="text-sm text-gray-500">{viewingDriver.profile.city}, {viewingDriver.profile.state}</p>
                  )}
                  {viewingDriver.driverProfile?.verificationStatus === 'APPROVED' ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full mt-1">
                      <ShieldCheck className="w-3 h-3" /> Verified Driver
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1">
                      Unverified
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              {viewingDriver.driverProfile && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">
                      {viewingDriver.driverProfile.rating > 0 ? viewingDriver.driverProfile.rating.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> Rating
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{viewingDriver.driverProfile.totalTrips ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Trips</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{viewingDriver.driverProfile.completionRate ?? 0}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">Completion</p>
                  </div>
                </div>
              )}

              {/* Vehicle */}
              {viewingDriver.driverProfile && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-gray-400" /> Vehicle
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1.5">
                    {viewingDriver.driverProfile.vehicleType && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium">{viewingDriver.driverProfile.vehicleType.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {viewingDriver.driverProfile.vehicleMake && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Make / Model</span>
                        <span className="font-medium">
                          {viewingDriver.driverProfile.vehicleMake} {viewingDriver.driverProfile.vehicleModel} {viewingDriver.driverProfile.vehicleYear}
                        </span>
                      </div>
                    )}
                    {viewingDriver.driverProfile.vehiclePlate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plate</span>
                        <span className="font-medium">{viewingDriver.driverProfile.vehiclePlate}</span>
                      </div>
                    )}
                    {viewingDriver.driverProfile.maxWeightKg && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Max Load</span>
                        <span className="font-medium">{viewingDriver.driverProfile.maxWeightKg} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verified documents */}
              {viewingDriver.documents?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-gray-400" /> Verified Documents
                  </h3>
                  <div className="space-y-1.5">
                    {viewingDriver.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        <span className="text-green-800 font-medium">{doc.type.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {viewingDriver.profile?.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-gray-400" /> About
                  </h3>
                  <p className="text-sm text-gray-600">{viewingDriver.profile.bio}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
