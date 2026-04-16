import Link from 'next/link';
import { Truck } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="py-6 px-8">
        <Link href="/home" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            Freight<span className="text-blue-600">Flow</span>
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
