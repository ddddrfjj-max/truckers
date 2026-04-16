'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  Truck,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  FileText,
  Users,
  LogOut,
  BarChart3,
  ClipboardList,
  Upload,
  ShieldCheck,
  BookOpen,
  ScrollText,
  Mail,
} from 'lucide-react';

const shipperNav = [
  { href: '/shipper', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/shipper/shipments', label: 'Shipments', icon: Package },
  { href: '/shipper/shipments/new', label: 'Post Load', icon: Plus },
  { href: '/shipper/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/shipper/verify', label: 'Verify ID', icon: ShieldCheck },
];

const driverNav = [
  { href: '/driver', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/driver/browse', label: 'Browse', icon: Search },
  { href: '/driver/bids', label: 'My Bids', icon: ClipboardList },
  { href: '/driver/jobs', label: 'My Jobs', icon: Truck },
  { href: '/driver/documents', label: 'Docs', icon: Upload },
];

const adminNav = [
  { href: '/admin', label: 'Overview', icon: BarChart3, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/shipments', label: 'Shipments', icon: Package },
  { href: '/admin/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/admin/documents', label: 'Documents', icon: FileText },
  { href: '/admin/drivers', label: 'Verification', icon: ShieldCheck },
  { href: '/admin/messages', label: 'Messages', icon: Mail },
  { href: '/admin/audit', label: 'Audit', icon: ScrollText },
];

interface Props { role: string }

export function DashboardSidebar({ role }: Props) {
  const pathname = usePathname();

  const navItems =
    role === 'ADMIN' ? adminNav : role === 'DRIVER' ? driverNav : shipperNav;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const roleColor =
    role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
    role === 'DRIVER' ? 'bg-green-100 text-green-700' :
    'bg-blue-100 text-blue-700';

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex w-60 shrink-0 bg-white border-r border-gray-200 flex-col min-h-screen">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <Link href="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              Freight<span className="text-blue-600">Flow</span>
            </span>
          </Link>
          <span className={cn('mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full', roleColor)}>
            {role}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(href, exact)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive(href, exact) ? 'text-blue-600' : 'text-gray-400')} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <Link href="/home" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Truck className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900">
            Freight<span className="text-blue-600">Flow</span>
          </span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
