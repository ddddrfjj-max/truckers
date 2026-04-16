'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  Truck,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  User,
} from 'lucide-react';

const navLinks = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardHref =
    session?.user?.role === 'ADMIN'
      ? '/admin'
      : session?.user?.role === 'DRIVER'
        ? '/driver'
        : '/shipper';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Freight<span className="text-blue-600">Flow</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                <Link href={dashboardHref}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-gray-700 py-2"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <>
              <Link href={dashboardHref} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full">Sign In</Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
