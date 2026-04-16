'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function priceIcon(price: number | null, active: boolean) {
  const label = price ? formatCurrency(price) : 'Open';
  return L.divIcon({
    className: '',
    html: `<div style="
      background: ${active ? '#2563eb' : '#1e293b'};
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 20px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      border: 2px solid white;
      font-family: system-ui, sans-serif;
    ">${label}</div>`,
    iconAnchor: [28, 16],
    popupAnchor: [0, -20],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 7);
    } else {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

interface Shipment {
  id: string;
  title: string;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  pickupLat?: number;
  pickupLng?: number;
  budgetMax?: number;
  status: string;
}

interface LoadsMapProps {
  shipments: Shipment[];
  highlightId?: string;
}

export default function LoadsMap({ shipments, highlightId }: LoadsMapProps) {
  const mapped = shipments.filter((s) => s.pickupLat && s.pickupLng);
  const points: [number, number][] = mapped.map((s) => [s.pickupLat!, s.pickupLng!]);
  const center: [number, number] = points.length ? points[0] : [39.5, -98.35];

  return (
    <MapContainer
      center={center}
      zoom={5}
      style={{ width: '100%', height: '100%', borderRadius: '12px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.length > 0 && <FitBounds points={points} />}
      {mapped.map((s) => (
        <Marker
          key={s.id}
          position={[s.pickupLat!, s.pickupLng!]}
          icon={priceIcon(s.budgetMax ?? null, s.id === highlightId)}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{s.title}</p>
              <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 6 }}>
                {s.pickupCity}, {s.pickupState} → {s.deliveryCity}, {s.deliveryState}
              </p>
              {s.budgetMax && (
                <p style={{ color: '#16a34a', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                  Up to {formatCurrency(s.budgetMax)}
                </p>
              )}
              <a
                href={`/driver/browse/${s.id}`}
                style={{
                  display: 'inline-block',
                  background: '#2563eb',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: 6,
                  textDecoration: 'none',
                }}
              >
                View Details →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
