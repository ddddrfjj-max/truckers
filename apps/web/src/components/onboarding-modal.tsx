'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, User, MapPin, Camera, Truck, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface OnboardingModalProps {
  role: 'SHIPPER' | 'DRIVER';
  profileIncomplete: boolean;
}

const STORAGE_KEY = 'ff_onboarding_dismissed_v1';

export function OnboardingModal({ role, profileIncomplete }: OnboardingModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!profileIncomplete) return;
    const dismissed = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setOpen(true);
  }, [profileIncomplete]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  const isDriver = role === 'DRIVER';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="max-w-md">
        <div className="text-center mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${isDriver ? 'bg-orange-50' : 'bg-blue-50'}`}>
            {isDriver
              ? <Truck className="w-7 h-7 text-orange-500" />
              : <Package className="w-7 h-7 text-blue-600" />}
          </div>
          <h2 className="text-xl font-bold text-gray-900">Welcome to FreightFlow!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete your profile to {isDriver ? 'start getting more bookings' : 'build trust with drivers'}.
          </p>
        </div>

        <div className="space-y-3 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recommended steps</p>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
            <User className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">Add your full name</p>
              <p className="text-xs text-gray-500">Builds trust and makes communication easier</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
            <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">Set your city</p>
              <p className="text-xs text-gray-500">Helps match you with nearby {isDriver ? 'loads' : 'drivers'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
            <Camera className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {isDriver ? 'Add a photo of your truck / equipment' : 'Add a profile photo or business photo'}
              </p>
              <p className="text-xs text-gray-500">
                {isDriver
                  ? 'Shippers respond much better to drivers who show their rig — it signals professionalism'
                  : 'A photo of your establishment or garage reassures drivers and speeds up acceptance'}
              </p>
            </div>
          </div>

          {isDriver && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
              <CheckCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">Get verified</p>
                <p className="text-xs text-orange-700">
                  Verified drivers receive significantly more bids. Upload your license and insurance to get started.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/settings/profile" onClick={dismiss}>
            <Button className="w-full gap-2">
              Complete My Profile <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <button
            onClick={dismiss}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Skip for now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
