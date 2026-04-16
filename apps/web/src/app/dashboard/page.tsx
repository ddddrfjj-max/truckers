'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/login');
      return;
    }
    const role = session.user.role;
    if (role === 'ADMIN') router.replace('/admin');
    else if (role === 'DRIVER') router.replace('/driver');
    else router.replace('/shipper');
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}
