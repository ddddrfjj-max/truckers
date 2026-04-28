'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentsApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Upload, X, ImageIcon, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type WeightUnit = 'kg' | 'lbs';

// ─── Cargo type visual options ────────────────────────────────────────────────

const CARGO_OPTIONS = [
  { value: 'GENERAL',     label: 'General Cargo',     description: 'Boxes, furniture, household goods', emoji: '📦' },
  { value: 'FRAGILE',     label: 'Fragile / Glass',   description: 'Glassware, artwork, antiques',      emoji: '🪟' },
  { value: 'ELECTRONICS', label: 'Electronics',        description: 'Computers, TVs, appliances',        emoji: '💻' },
  { value: 'REFRIGERATED',label: 'Refrigerated',       description: 'Food, medicine, perishables',       emoji: '❄️' },
  { value: 'HAZARDOUS',   label: 'Hazardous',          description: 'Chemicals, flammables, gases',      emoji: '⚠️' },
  { value: 'OVERSIZED',   label: 'Oversized / Heavy',  description: 'Vehicles, machinery, equipment',    emoji: '🏗️' },
  { value: 'LIVESTOCK',   label: 'Livestock',          description: 'Animals, agricultural products',    emoji: '🐄' },
];

const VEHICLE_OPTIONS = [
  { value: '',                   label: 'Any vehicle' },
  { value: 'SEDAN',              label: 'Sedan' },
  { value: 'VAN',                label: 'Van' },
  { value: 'BOX_TRUCK',          label: 'Box Truck' },
  { value: 'FLATBED',            label: 'Flatbed' },
  { value: 'SEMI_TRUCK',         label: 'Semi Truck' },
  { value: 'REFRIGERATED_TRUCK', label: 'Refrigerated Truck' },
  { value: 'TANKER',             label: 'Tanker' },
  { value: 'PICKUP',             label: 'Pickup Truck' },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title:            z.string().min(5, 'Title must be at least 5 characters'),
  description:      z.string().optional(),
  weightValue:      z.coerce.number().min(0.1, 'Enter a valid weight'),
  specialHandling:  z.string().optional(),
  pickupAddress:    z.string().min(3, 'Required'),
  pickupCity:       z.string().min(2, 'Required'),
  pickupState:      z.string().min(2, 'Required'),
  pickupZip:        z.string().optional(),
  pickupDate:       z.string().min(1, 'Required'),
  deliveryAddress:  z.string().min(3, 'Required'),
  deliveryCity:     z.string().min(2, 'Required'),
  deliveryState:    z.string().min(2, 'Required'),
  deliveryZip:      z.string().optional(),
  deliveryDate:     z.string().optional(),
  budgetSuggestion: z.coerce.number().optional(),
  vehicleRequired:  z.string().optional().transform(v => v || undefined),
});

type FormData = z.infer<typeof schema>;

// ─── Image preview type ───────────────────────────────────────────────────────

interface ImagePreview {
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploaded: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewShipmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cargoType, setCargoType] = useState('GENERAL');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [images, setImages] = useState<ImagePreview[]>([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const addImages = (files: File[]) => {
    const remaining = 8 - images.length;
    const toAdd = files.slice(0, remaining).map(f => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      uploading: false,
      uploaded: false,
    }));
    setImages(prev => [...prev, ...toAdd]);
  };

  const removeImage = (i: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      const weightKg = weightUnit === 'lbs'
        ? parseFloat((data.weightValue / 2.20462).toFixed(3))
        : data.weightValue;
      const { weightValue, budgetSuggestion, ...rest } = data;
      return shipmentsApi.create({
        ...rest,
        cargoType,
        weightKg,
        ...(budgetSuggestion ? { budgetMax: budgetSuggestion } : {}),
      });
    },
    onSuccess: async (shipment) => {
      queryClient.invalidateQueries({ queryKey: ['my-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipper-stats'] });

      // Upload images sequentially after shipment is created
      if (images.length > 0) {
        const list = [...images];
        for (let i = 0; i < list.length; i++) {
          list[i] = { ...list[i], uploading: true };
          setImages([...list]);
          try {
            await shipmentsApi.uploadImage(shipment.id, list[i].file);
            list[i] = { ...list[i], uploading: false, uploaded: true };
          } catch {
            list[i] = { ...list[i], uploading: false };
            toast.error(`Could not upload ${list[i].file.name}`);
          }
          setImages([...list]);
        }
      }

      toast.success('Shipment posted successfully!');
      router.push(`/shipper/shipments/${shipment.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = (data: FormData) => createMutation.mutate(data);

  const selectedCargo = CARGO_OPTIONS.find(o => o.value === cargoType);

  return (
    <div>
      <PageHeader
        title="Post a New Shipment"
        description="Fill in the details below to get bids from drivers"
        action={
          <Link href="/shipper/shipments">
            <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mt-6">

        {/* ── Step 1: What are you shipping? ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What are you shipping?</CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">Pick the category that best fits your cargo</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CARGO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCargoType(opt.value)}
                  className={cn(
                    'text-left rounded-xl border-2 p-4 transition-all duration-150',
                    cargoType === opt.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
                  )}
                >
                  <div className="text-2xl mb-2 leading-none">{opt.emoji}</div>
                  <p className={cn('font-semibold text-sm leading-tight', cargoType === opt.value ? 'text-blue-700' : 'text-gray-800')}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 leading-tight">{opt.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Shipment details ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Shipment Details
              {selectedCargo && (
                <span className="ml-2 text-sm font-normal text-gray-400">— {selectedCargo.emoji} {selectedCargo.label}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="e.g. Office furniture from Chicago to Dallas" {...register('title')} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the cargo, quantity, any notes for the driver..." rows={3} {...register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="weightValue">Weight *</Label>
                  <div className="flex rounded-md border border-input overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className={cn('px-2.5 py-1 transition-colors', weightUnit === 'kg' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
                    >kg</button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('lbs')}
                      className={cn('px-2.5 py-1 transition-colors', weightUnit === 'lbs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
                    >lbs</button>
                  </div>
                </div>
                <Input id="weightValue" type="number" step="0.1" min="0.1" placeholder={weightUnit === 'kg' ? '500' : '1100'} {...register('weightValue')} />
                {errors.weightValue && <p className="text-xs text-red-500">{errors.weightValue.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleRequired">Vehicle Required</Label>
                <select id="vehicleRequired" {...register('vehicleRequired')} className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm">
                  {VEHICLE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialHandling">
                {cargoType === 'FRAGILE' ? 'Fragile Handling Instructions' :
                 cargoType === 'HAZARDOUS' ? 'Hazardous Material Details *' :
                 cargoType === 'REFRIGERATED' ? 'Temperature Requirements' :
                 'Special Handling Notes (optional)'}
              </Label>
              <Input
                id="specialHandling"
                placeholder={
                  cargoType === 'FRAGILE' ? 'e.g. Handle with care, do not stack, keep upright' :
                  cargoType === 'HAZARDOUS' ? 'e.g. Class 3 flammable liquid, UN1203, keep away from heat' :
                  cargoType === 'REFRIGERATED' ? 'e.g. Keep refrigerated at 2–4°C throughout transit' :
                  'Any special requirements for handling or transit'
                }
                {...register('specialHandling')}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Photos ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-400" />
              Photos
              <span className="text-xs font-normal text-gray-400">optional · up to 8</span>
            </CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">Help drivers see exactly what needs moving — better photos = better bids</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Drop zone */}
            <div
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                if (files.length) addImages(files);
              }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-colors',
                images.length >= 8
                  ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30',
              )}
            >
              <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">
                {images.length >= 8 ? 'Maximum 8 photos reached' : 'Drop images here or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max 10 MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                disabled={images.length >= 8}
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) addImages(files);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Image grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                    {img.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                    {img.uploaded && (
                      <div className="absolute top-1.5 left-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-400 drop-shadow" />
                      </div>
                    )}
                    {!img.uploading && (
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* ── Pickup ── */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pickup Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Street Address *</Label>
              <Input placeholder="123 Main Street" {...register('pickupAddress')} />
              {errors.pickupAddress && <p className="text-xs text-red-500">{errors.pickupAddress.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input placeholder="Chicago" {...register('pickupCity')} />
                {errors.pickupCity && <p className="text-xs text-red-500">{errors.pickupCity.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input placeholder="IL" maxLength={2} className="uppercase" {...register('pickupState')} />
              </div>
              <div className="space-y-2">
                <Label>ZIP</Label>
                <Input placeholder="60601" {...register('pickupZip')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pickup Date & Time *</Label>
              <Input type="datetime-local" {...register('pickupDate')} />
              {errors.pickupDate && <p className="text-xs text-red-500">{errors.pickupDate.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* ── Delivery ── */}
        <Card>
          <CardHeader><CardTitle className="text-base">Delivery Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Street Address *</Label>
              <Input placeholder="456 Oak Avenue" {...register('deliveryAddress')} />
              {errors.deliveryAddress && <p className="text-xs text-red-500">{errors.deliveryAddress.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input placeholder="Dallas" {...register('deliveryCity')} />
                {errors.deliveryCity && <p className="text-xs text-red-500">{errors.deliveryCity.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input placeholder="TX" maxLength={2} className="uppercase" {...register('deliveryState')} />
              </div>
              <div className="space-y-2">
                <Label>ZIP</Label>
                <Input placeholder="75201" {...register('deliveryZip')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Delivery Deadline (optional)</Label>
              <Input type="datetime-local" {...register('deliveryDate')} />
            </div>
          </CardContent>
        </Card>

        {/* ── Budget ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Price Suggestion (USD)</CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">Optional — gives drivers a reference point for their bids</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Suggested Price</Label>
              <div className="relative max-w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input type="number" min="0" placeholder="750" className="pl-7" {...register('budgetSuggestion')} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Drivers will make their own offers — this is not a fixed price</p>
          </CardContent>
        </Card>

        <div className="flex gap-3 pb-10">
          <Button type="submit" disabled={createMutation.isPending} className="gap-2 px-8">
            {createMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</>
              : 'Post Shipment'}
          </Button>
          <Link href="/shipper/shipments">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
