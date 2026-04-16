import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Package, Search, CheckCircle, Truck, Star, Shield } from 'lucide-react';

const shipperSteps = [
  { step: '01', title: 'Create Your Account', desc: 'Sign up as a shipper in under 2 minutes. No credit card required.' },
  { step: '02', title: 'Post Your Shipment', desc: 'Enter pickup and delivery details, cargo specs, dates, and your budget range.' },
  { step: '03', title: 'Review Bids', desc: 'Verified carriers submit competitive bids. Review their profiles, ratings, and pricing.' },
  { step: '04', title: 'Accept & Track', desc: 'Accept the best bid and track your shipment in real-time until delivery.' },
];

const driverSteps = [
  { step: '01', title: 'Register & Verify', desc: 'Create a driver account and upload your license, registration, and insurance.' },
  { step: '02', title: 'Browse Available Loads', desc: 'Filter loads by location, cargo type, vehicle requirement, and payout.' },
  { step: '03', title: 'Place Your Bid', desc: 'Submit a competitive bid with your price and estimated delivery date.' },
  { step: '04', title: 'Get Hired & Get Paid', desc: 'When your bid is accepted, complete the job and get paid for your work.' },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold mb-6">How FreightFlow Works</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Whether you're moving freight or hauling loads, FreightFlow makes the process
            simple, transparent, and competitive.
          </p>
        </div>
      </section>

      {/* For Shippers */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">For Shippers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shipperSteps.map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="bg-gray-50 rounded-2xl p-6 h-full">
                  <div className="text-5xl font-black text-blue-100 mb-3">{step}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/register?role=SHIPPER">
              <Button className="gap-2">Start Shipping <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Drivers */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">For Drivers & Carriers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {driverSteps.map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="text-5xl font-black text-gray-100 mb-3">{step}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/register?role=DRIVER">
              <Button variant="outline" className="gap-2">Join as Driver <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Built on Trust</h2>
          <p className="text-gray-500 mb-12">Every carrier is verified. Every transaction is transparent.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Verified Carriers', desc: 'Every driver completes identity, license, vehicle, and insurance verification before going live.' },
              { icon: Star, title: 'Reputation System', desc: 'Both shippers and drivers are rated after each job. High performers get more business.' },
              { icon: CheckCircle, title: 'Transparent Pricing', desc: 'No hidden fees or surprises. You see exactly what you pay and what carriers earn.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center p-8 rounded-2xl bg-gray-50">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
