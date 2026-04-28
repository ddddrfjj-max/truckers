'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role={session.user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* pt-16 clears fixed top bar; pb-20 clears bottom tab bar (shipper/driver only) */}
        <main className={`flex-1 p-4 pt-16 md:pt-6 md:pb-6 md:p-8 overflow-auto ${
          ['ADMIN', 'DEVELOPER'].includes(session.user.role) ? 'pb-4' : 'pb-20'
        }`}>{children}</main>
      </div>
    </div>
  );
}
