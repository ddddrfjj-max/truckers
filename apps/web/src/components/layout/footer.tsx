import Link from 'next/link';
import { Truck, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-xl font-bold">
                Freight<span className="text-blue-400">Flow</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              The modern transport marketplace connecting shippers with trusted
              carriers across the country.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">For Shippers</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">For Drivers</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                hello@freightflow.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +1 (555) 000-1234
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                123 Logistics Way, Chicago, IL 60601
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2026 FreightFlow. All rights reserved.</p>
          <p className="text-sm">Built for shippers and drivers who mean business.</p>
        </div>
      </div>
    </footer>
  );
}
