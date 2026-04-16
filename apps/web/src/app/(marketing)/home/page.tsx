import Link from 'next/link';
import {
  Truck,
  Package,
  ShieldCheck,
  Star,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Clock,
  MapPin,
  Users,
  Award,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const stats = [
  { label: 'Active Carriers', value: '2,400+', icon: Truck },
  { label: 'Shipments Delivered', value: '18,000+', icon: Package },
  { label: 'Cities Covered', value: '350+', icon: MapPin },
  { label: 'Avg. Bid Response', value: '< 2 hrs', icon: Clock },
];

const features = [
  {
    icon: Package,
    title: 'Post Your Load',
    description:
      'Create a detailed shipment listing with pickup/delivery locations, cargo specs, and your budget range.',
  },
  {
    icon: TrendingUp,
    title: 'Receive Competitive Bids',
    description:
      'Verified drivers review your load and submit competitive bids. Compare pricing, ratings, and profiles.',
  },
  {
    icon: ShieldCheck,
    title: 'Book with Confidence',
    description:
      'Accept the best bid and track your shipment in real-time. Drivers are verified and insured.',
  },
  {
    icon: Star,
    title: 'Rate & Review',
    description:
      'After delivery, rate the experience. Our reputation system keeps quality high on both sides.',
  },
];

const benefits = [
  'No upfront fees — pay only when you book',
  'Verified, insured carrier network',
  'Real-time shipment tracking',
  'Competitive bidding gets you the best price',
  'Dedicated support for disputes',
  'Mobile-friendly for on-the-go management',
];

const testimonials = [
  {
    name: 'Sarah K.',
    role: 'Operations Manager',
    company: 'Midwest Distributing',
    text: 'FreightFlow cut our shipping costs by 22% in the first quarter. The bidding system is a game changer.',
    rating: 5,
  },
  {
    name: 'Marcus T.',
    role: 'Independent Carrier',
    company: 'T&M Logistics',
    text: "I've doubled my monthly bookings since joining. The platform makes it easy to find loads that fit my route.",
    rating: 5,
  },
  {
    name: 'Linda R.',
    role: 'Supply Chain Director',
    company: 'Pacific Imports LLC',
    text: 'The transparency is what sold me. I can see exactly who is moving my freight and track every step.',
    rating: 5,
  },
];

const cargoTypes = [
  'General Freight',
  'Electronics',
  'Refrigerated',
  'Fragile Cargo',
  'Hazardous Materials',
  'Oversized Loads',
  'Livestock',
  'Flatbed',
];

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6 text-sm text-blue-300">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Now live — 2,400+ verified carriers
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Ship Smarter.
              <br />
              <span className="text-blue-400">Earn More.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
              FreightFlow connects shippers with trusted drivers through a
              competitive bidding marketplace. Post a load in minutes. Get bids
              from verified carriers. Move freight at the best price.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register?role=SHIPPER">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-base px-8">
                  Post a Shipment
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register?role=DRIVER">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-500 text-white hover:bg-white/10 text-base px-8"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Find Loads
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center text-white">
                <Icon className="w-6 h-6 mx-auto mb-2 text-blue-200" />
                <div className="text-3xl font-extrabold">{value}</div>
                <div className="text-blue-200 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How FreightFlow Works</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From post to delivery in four simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map(({ icon: Icon, title, description }, i) => (
              <div key={title} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 relative">
                    <Icon className="w-7 h-7 text-blue-600" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
                </div>
                {i < features.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-8 border-t-2 border-dashed border-blue-200 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/how-it-works">
              <Button variant="outline" size="lg" className="gap-2">
                Learn More <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Two-Sided CTA */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Shippers */}
            <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm">
              <Package className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Shippers</h3>
              <p className="text-gray-500 mb-6">
                Stop overpaying for freight. Post your load and let the market come to
                you with competitive quotes from our verified carrier network.
              </p>
              <ul className="space-y-2 mb-8">
                {benefits.slice(0, 3).map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=SHIPPER">
                <Button className="w-full gap-2">
                  Post Your First Load <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* For Drivers */}
            <div className="bg-slate-900 rounded-3xl p-10 text-white">
              <Truck className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold mb-4">For Drivers & Carriers</h3>
              <p className="text-slate-300 mb-6">
                Find loads that match your route, vehicle, and schedule. Bid on
                what you want and grow your business on your terms.
              </p>
              <ul className="space-y-2 mb-8">
                {benefits.slice(3).map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=DRIVER">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                  Start Earning <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cargo Types */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">All Cargo Types Covered</h2>
            <p className="text-gray-500 text-lg">Specialized carriers for every freight requirement</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {cargoTypes.map((type) => (
              <span
                key={type}
                className="px-5 py-2.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 rounded-full text-sm font-medium transition-colors cursor-default"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by Shippers and Carriers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Ready to move freight smarter?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of shippers and drivers who rely on FreightFlow every day.
            No setup fees. No commitments. Just results.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 gap-2 text-base px-8">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-base px-8"
              >
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
