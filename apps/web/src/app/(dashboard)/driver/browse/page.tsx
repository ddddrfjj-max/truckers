'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { shipmentsApi } from '@/lib/api';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatCurrency, formatWeight } from '@/lib/utils';
import { Search, MapPin, Loader2, Truck, DollarSign, Map, List, ArrowRight, Package } from 'lucide-react';
import Link from 'next/link';

const LoadsMap = dynamic(() => import('@/components/dashboard/loads-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  ),
});

const CARGO_EMOJI: Record<string, string> = {
  GENERAL: '📦', FRAGILE: '🫙', HAZARDOUS: '⚠️',
  REFRIGERATED: '❄️', OVERSIZED: '🚛', LIVESTOCK: '🐄', ELECTRONICS: '💻',
};

export default function BrowseLoadsPage() {
  const [search, setSearch] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [hoveredId, setHoveredId] = useState<string | undefined>();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['browse-loads', search, pickupCity, deliveryCity],
    queryFn: () => shipmentsApi.browse({ search, pickupCity, deliveryCity, limit: 50 }),
    retry: 1,
  });

  const shipments = data?.data ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Browse Loads</h1>
        <p className="text-sm text-gray-500 mt-0.5">Find loads that match your route and vehicle</p>
      </div>

      {/* Filters + View toggle */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search loads..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-1 sm:flex-none">
          <Input
            placeholder="Pickup city"
            className="h-10 flex-1 sm:w-36"
            value={pickupCity}
            onChange={(e) => setPickupCity(e.target.value)}
          />
          <Input
            placeholder="Delivery city"
            className="h-10 flex-1 sm:w-36"
            value={deliveryCity}
            onChange={(e) => setDeliveryCity(e.target.value)}
          />
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 flex items-center gap-1 text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-3 py-2 flex items-center gap-1 text-sm font-medium transition-colors border-l border-gray-200 ${
                view === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Count */}
      {!isLoading && !isError && (
        <p className="text-xs text-gray-400 mb-3">{shipments.length} loads available</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <p className="text-red-500 font-medium">Failed to load available loads</p>
          <p className="text-sm text-gray-500 mt-1">{(error as Error)?.message || 'Please try refreshing'}</p>
        </div>
      ) : !shipments.length ? (
        <EmptyState icon={Truck} title="No loads available" description="Check back later or adjust your filters" />
      ) : view === 'map' ? (
        /* ── MAP VIEW ── */
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          {/* Map */}
          <div className="h-72 sm:h-96 lg:h-full lg:flex-1 min-h-0 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <LoadsMap shipments={shipments} highlightId={hoveredId} />
          </div>

          {/* Sidebar list on desktop, scrollable strip on mobile */}
          <div className="lg:w-80 flex flex-col gap-2 overflow-y-auto lg:max-h-full max-h-72">
            {shipments.map((s: any) => (
              <Link
                key={s.id}
                href={`/driver/browse/${s.id}`}
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(undefined)}
                className={`block bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-all cursor-pointer ${
                  hoveredId === s.id ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{s.title}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{s.pickupCity} → {s.deliveryCity}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(s.pickupDate)}</p>
                  </div>
                  {s.budgetMax && (
                    <p className="text-sm font-bold text-green-600 shrink-0">{formatCurrency(s.budgetMax)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="space-y-3">
          {shipments.map((s: any) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-4 sm:p-5">
                {/* Top row: title + price */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/driver/browse/${s.id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 hover:underline text-base leading-tight block"
                    >
                      {s.title}
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                      <span>{s.pickupCity}, {s.pickupState}</span>
                      <ArrowRight className="w-3 h-3 mx-0.5 text-gray-300" />
                      <span>{s.deliveryCity}, {s.deliveryState}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {s.budgetMax ? (
                      <>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(s.budgetMax)}</p>
                        <p className="text-xs text-gray-400">max budget</p>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No budget set</span>
                    )}
                  </div>
                </div>

                {/* Meta chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {CARGO_EMOJI[s.cargoType] ?? '📦'} {s.cargoType.replace(/_/g, ' ')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    <Package className="w-3 h-3" /> {formatWeight(s.weightKg)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                    📅 {formatDate(s.pickupDate)}
                  </span>
                  {s.vehicleRequired && (
                    <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full">
                      🚛 {s.vehicleRequired.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    {s._count?.bids ?? 0} bid{s._count?.bids !== 1 ? 's' : ''}
                  </span>
                </div>

                {s.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{s.description}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  <Link href={`/driver/browse/${s.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> View Details
                    </Button>
                  </Link>
                  <Link href={`/driver/browse/${s.id}`} className="flex-1">
                    <Button size="sm" className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700">
                      <DollarSign className="w-3.5 h-3.5" /> Place Bid
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
