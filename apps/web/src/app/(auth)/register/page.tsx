'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2, Package, Truck } from 'lucide-react';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  role: z.enum(['SHIPPER', 'DRIVER']),
});

type FormData = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get('role') as 'SHIPPER' | 'DRIVER') || 'SHIPPER';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'SHIPPER' | 'DRIVER'>(defaultRole);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });

  const handleRoleChange = (role: 'SHIPPER' | 'DRIVER') => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await authApi.register(data);
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.ok) {
        toast.success('Account created! Welcome to FreightFlow.');
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      <Card className="shadow-lg border-0">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>Join thousands of shippers and drivers on FreightFlow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label className="mb-3 block">I am a...</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange('SHIPPER')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
                  selectedRole === 'SHIPPER' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
                )}
              >
                <Package className={cn('w-6 h-6', selectedRole === 'SHIPPER' ? 'text-blue-600' : 'text-gray-400')} />
                <span className={cn('font-semibold text-sm', selectedRole === 'SHIPPER' ? 'text-blue-700' : 'text-gray-600')}>Shipper</span>
                <span className="text-xs text-gray-400 text-center">I need to move freight</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('DRIVER')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
                  selectedRole === 'DRIVER' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300',
                )}
              >
                <Truck className={cn('w-6 h-6', selectedRole === 'DRIVER' ? 'text-blue-600' : 'text-gray-400')} />
                <span className={cn('font-semibold text-sm', selectedRole === 'DRIVER' ? 'text-blue-700' : 'text-gray-600')}>Driver / Carrier</span>
                <span className="text-xs text-gray-400 text-center">I haul freight</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <input type="hidden" {...register('role')} value={selectedRole} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
