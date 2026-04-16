import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, Package, Thermometer, Zap, Shield, Globe } from 'lucide-react';

const services = [
  {
    icon: Package,
    title: 'General Freight',
    desc: 'Standard palletized or boxed goods. Our most common service for everyday commercial shipments.',
    features: ['Box trucks & vans', 'Full and partial loads', 'Door-to-door delivery'],
  },
  {
    icon: Thermometer,
    title: 'Refrigerated Transport',
    desc: 'Temperature-controlled transport for perishables, pharmaceuticals, and food products.',
    features: ['2–8°C cold chain', 'Certified reefer units', 'Temperature logs provided'],
  },
  {
    icon: Zap,
    title: 'Electronics & Fragile',
    desc: 'Specialized handling for electronics, artwork, and high-value fragile items.',
    features: ['Padded transport', 'Shock-absorbing packaging', 'Insurance available'],
  },
  {
    icon: Truck,
    title: 'Oversized & Heavy',
    desc: 'Flatbed and heavy-haul transport for large machinery, construction materials, and more.',
    features: ['Flatbed & lowboy', 'Permit assistance', 'Up to 80,000 lbs'],
  },
  {
    icon: Shield,
    title: 'Hazardous Materials',
    desc: 'HAZMAT-certified carriers for chemicals, fuel, and other regulated cargo.',
    features: ['HAZMAT certified drivers', 'Compliance documentation', 'Spill containment'],
  },
  {
    icon: Globe,
    title: 'Long Haul',
    desc: 'Coast-to-coast and cross-country freight. Reliable long-distance transport for any load.',
    features: ['48-state coverage', 'Real-time GPS tracking', 'ELD compliant'],
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold mb-6">Our Services</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Whatever you're shipping, we have verified carriers who specialize in it.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(({ icon: Icon, title, desc, features }) => (
              <div key={title} className="border border-gray-100 rounded-2xl p-8 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 mb-4 text-sm leading-relaxed">{desc}</p>
                <ul className="space-y-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold mb-6">Ready to ship?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
            Post your first load free and get competitive quotes from our carrier network within hours.
          </p>
          <Link href="/register?role=SHIPPER">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 gap-2 text-base px-8">
              Post a Shipment <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
