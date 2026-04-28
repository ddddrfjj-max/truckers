'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Truck, Save } from 'lucide-react';
import { toast } from 'sonner';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName:  z.string().min(1, 'Required'),
  lastName:   z.string().min(1, 'Required'),
  phone:      z.string().optional(),
  company:    z.string().optional(),
  city:       z.string().optional(),
  state:      z.string().optional(),
  address:    z.string().optional(),
  bio:        z.string().optional(),
});

const driverSchema = z.object({
  vehicleType:         z.string().optional(),
  vehicleMake:         z.string().optional(),
  vehicleModel:        z.string().optional(),
  vehicleYear:         z.coerce.number().optional(),
  vehiclePlate:        z.string().optional(),
  vehicleCapacityTons: z.coerce.number().optional(),
  licenseNumber:       z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type DriverForm  = z.infer<typeof driverSchema>;

const VEHICLE_TYPES = [
  { value: '', label: 'Select vehicle type' },
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'VAN', label: 'Van' },
  { value: 'BOX_TRUCK', label: 'Box Truck' },
  { value: 'FLATBED', label: 'Flatbed' },
  { value: 'SEMI_TRUCK', label: 'Semi Truck' },
  { value: 'REFRIGERATED_TRUCK', label: 'Refrigerated Truck' },
  { value: 'TANKER', label: 'Tanker' },
  { value: 'PICKUP', label: 'Pickup Truck' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isDriver = session?.user?.role === 'DRIVER';

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.me,
    enabled: !!session,
  });

  const { data: driverProfile, isLoading: driverLoading } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: usersApi.driverProfile,
    enabled: isDriver,
    retry: false,
  });

  // ── Profile form ──────────────────────────────────────────────────────────

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '' },
  });

  useEffect(() => {
    if (me?.profile) {
      reset({
        firstName:  me.profile.firstName ?? '',
        lastName:   me.profile.lastName  ?? '',
        phone:      me.profile.phone     ?? '',
        company:    me.profile.company   ?? '',
        city:       me.profile.city      ?? '',
        state:      me.profile.state     ?? '',
        address:    me.profile.address   ?? '',
        bio:        me.profile.bio       ?? '',
      });
    }
  }, [me, reset]);

  const profileMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      toast.success('Profile saved');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Driver form ───────────────────────────────────────────────────────────

  const { register: rd, handleSubmit: hsd, reset: resetDriver, formState: { errors: ed, isDirty: driverDirty } } = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
  });

  useEffect(() => {
    if (driverProfile) {
      resetDriver({
        vehicleType:         driverProfile.vehicleType         ?? '',
        vehicleMake:         driverProfile.vehicleMake         ?? '',
        vehicleModel:        driverProfile.vehicleModel        ?? '',
        vehicleYear:         driverProfile.vehicleYear         ?? undefined,
        vehiclePlate:        driverProfile.vehiclePlate        ?? '',
        vehicleCapacityTons: driverProfile.vehicleCapacityTons ?? undefined,
        licenseNumber:       driverProfile.licenseNumber       ?? '',
      });
    }
  }, [driverProfile, resetDriver]);

  const driverMutation = useMutation({
    mutationFn: (data: DriverForm) => usersApi.updateDriverProfile({
      ...data,
      vehicleType: data.vehicleType || undefined,
    }),
    onSuccess: () => {
      toast.success('Vehicle details saved');
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Update your personal details and preferences"
      />

      <div className="max-w-2xl mt-6 space-y-6">

        {/* ── Personal info ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name *</Label>
                  <Input {...register('firstName')} />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name *</Label>
                  <Input {...register('lastName')} />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input type="tel" placeholder="+1 (555) 000-0000" {...register('phone')} />
              </div>

              <div className="space-y-1.5">
                <Label>Company / Business Name</Label>
                <Input placeholder="Optional" {...register('company')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input placeholder="Chicago" {...register('city')} />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input placeholder="IL" maxLength={2} className="uppercase" {...register('state')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Street Address</Label>
                <Input placeholder="123 Main Street" {...register('address')} />
              </div>

              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea
                  rows={3}
                  placeholder={isDriver
                    ? "Tell shippers about your experience, specialties, and what makes you reliable..."
                    : "Tell drivers about your business and what you typically ship..."}
                  {...register('bio')}
                />
              </div>

              <Button type="submit" disabled={profileMutation.isPending || !isDirty} className="gap-2">
                {profileMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  : <><Save className="w-4 h-4" /> Save Profile</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Driver vehicle details ── */}
        {isDriver && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-400" /> Vehicle & License Details
              </CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Complete vehicle info builds trust with shippers and is required for verification.
              </p>
            </CardHeader>
            <CardContent>
              {driverLoading ? (
                <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : (
                <form onSubmit={hsd((d) => driverMutation.mutate(d))} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Vehicle Type</Label>
                    <select className="h-10 w-full rounded-md border border-input bg-background text-sm px-3" {...rd('vehicleType')}>
                      {VEHICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Make</Label>
                      <Input placeholder="Ford" {...rd('vehicleMake')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Model</Label>
                      <Input placeholder="F-150" {...rd('vehicleModel')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Year</Label>
                      <Input type="number" placeholder="2022" {...rd('vehicleYear')} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Plate Number</Label>
                      <Input placeholder="ABC-1234" className="uppercase" {...rd('vehiclePlate')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Max Capacity (tons)</Label>
                      <Input type="number" step="0.1" placeholder="5.0" {...rd('vehicleCapacityTons')} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Driver License Number</Label>
                    <Input placeholder="DL-0000000" {...rd('licenseNumber')} />
                  </div>

                  <Button type="submit" disabled={driverMutation.isPending || !driverDirty} className="gap-2">
                    {driverMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      : <><Save className="w-4 h-4" /> Save Vehicle Details</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Account info (read-only) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-gray-500">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{me?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span className="font-medium text-gray-900">{me?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Member since</span>
              <span className="font-medium text-gray-900">
                {me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
