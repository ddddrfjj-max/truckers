'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  Truck, LayoutDashboard, Package, Plus, Search, FileText,
  Users, LogOut, BarChart3, ClipboardList, Upload, ShieldCheck,
  BookOpen, ScrollText, Mail, Menu, X, User,
} from 'lucide-react';

const shipperNav = [
  { href: '/shipper',              label: 'Overview',  icon: LayoutDashboard, exact: true },
  { href: '/shipper/shipments',    label: 'Shipments', icon: Package },
  { href: '/shipper/shipments/new',label: 'Post Load', icon: Plus },
  { href: '/shipper/bookings',     label: 'Bookings',  icon: BookOpen },
  { href: '/shipper/verify',       label: 'Verify ID', icon: ShieldCheck },
];

const driverNav = [
  { href: '/driver',          label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/driver/browse',   label: 'Browse',   icon: Search },
  { href: '/driver/bids',     label: 'My Bids',  icon: ClipboardList },
  { href: '/driver/jobs',     label: 'My Jobs',  icon: Truck },
  { href: '/driver/documents',label: 'Docs',     icon: Upload },
];

const adminNav = [
  { href: '/admin',            label: 'Overview',     icon: BarChart3,      exact: true },
  { href: '/admin/users',      label: 'Users',        icon: Users },
  { href: '/admin/shipments',  label: 'Shipments',    icon: Package },
  { href: '/admin/bookings',   label: 'Bookings',     icon: BookOpen },
  { href: '/admin/documents',  label: 'Documents',    icon: FileText },
  { href: '/admin/drivers',    label: 'Verification', icon: ShieldCheck },
  { href: '/admin/messages',   label: 'Messages',     icon: Mail },
  { href: '/admin/audit',      label: 'Audit',        icon: ScrollText },
];

interface Props { role: string }

export function DashboardSidebar({ role }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const isAdmin  = role === 'ADMIN' || role === 'DEVELOPER';
  const navItems = isAdmin ? adminNav : role === 'DRIVER' ? driverNav : shipperNav;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const roleColor =
    role === 'DEVELOPER' ? 'bg-red-100 text-red-700' :
    role === 'ADMIN'      ? 'bg-purple-100 text-purple-700' :
    role === 'DRIVER'     ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700';

  const NavLink = ({ href, label, icon: Icon, exact }: typeof navItems[0]) => (
    <Link
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
  );

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────────────────── */}
      <div className="hidden md:flex w-60 shrink-0 bg-white border-r border-gray-200 flex-col min-h-screen">
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

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => <NavLink key={item.href} {...item} />)}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-0.5">
          <Link
            href="/settings/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 text-gray-400" />
            Profile
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Mobile top bar ─────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        {/* Hamburger (admin) or logo (shipper/driver) */}
        {isAdmin ? (
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        ) : (
          <Link href="/home" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">
              Freight<span className="text-blue-600">Flow</span>
            </span>
          </Link>
        )}

        {/* Centre logo for admin */}
        {isAdmin && (
          <Link href="/home" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">
              Freight<span className="text-blue-600">Flow</span>
            </span>
          </Link>
        )}

        <div className="flex items-center gap-1">
          <Link
            href="/settings/profile"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Profile"
          >
            <User className="w-4 h-4" />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Admin: slide-in drawer ──────────────────────────────────── */}
      {isAdmin && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              'md:hidden fixed inset-0 z-50 bg-black/40 transition-opacity duration-200',
              drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
            )}
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div className={cn(
            'md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-xl flex flex-col transition-transform duration-200 ease-out',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <Link href="/home" className="flex items-center gap-2" onClick={() => setDrawerOpen(false)}>
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    Freight<span className="text-blue-600">Flow</span>
                  </span>
                </Link>
                <span className={cn('mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full', roleColor)}>
                  {role}
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {navItems.map((item) => <NavLink key={item.href} {...item} />)}
            </nav>

            <div className="p-3 border-t border-gray-100 space-y-0.5">
              <Link
                href="/settings/profile"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" />
                Profile
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Shipper/Driver: bottom tab bar ─────────────────────────── */}
      {!isAdmin && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex safe-area-inset-bottom">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors min-w-0',
                  active ? 'text-blue-600' : 'text-gray-400',
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', active && 'text-blue-600')} />
                <span className="text-[10px] font-medium leading-none truncate w-full text-center px-0.5">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
