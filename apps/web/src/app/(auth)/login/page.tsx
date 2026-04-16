'use client';

import { Suspense, useState } from 'react';
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
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

const demoAccounts = [
  { label: 'Shipper', email: 'shipper@demo.com', password: 'demo1234' },
  { label: 'Driver', email: 'driver@demo.com', password: 'demo1234' },
  { label: 'Admin', email: 'admin@freightflow.com', password: 'admin1234' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || undefined;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        toast.success('Welcome back!');
        setTimeout(() => {
          router.push(callbackUrl || '/dashboard');
        }, 100);
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-lg border-0">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your FreightFlow account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Demo Accounts</p>
            <div className="flex gap-2 flex-wrap">
              {demoAccounts.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => fillDemo(a.email, a.password)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
