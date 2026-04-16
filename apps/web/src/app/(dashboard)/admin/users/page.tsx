'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { Users, Search, Loader2, ShieldBan, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role],
    queryFn: () => adminApi.users({ search, role, limit: 100 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      adminApi.updateUserStatus(userId, status),
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Users" description={`${data?.total ?? 0} total users`} />

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name or email..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="SHIPPER">Shippers</option>
          <option value="DRIVER">Drivers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : !data?.data?.length ? (
        <EmptyState icon={Users} title="No users found" description="No users match your search" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.data.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'DRIVER' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    {user.role !== 'ADMIN' && (
                      user.status === 'ACTIVE' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 gap-1"
                          onClick={() => statusMutation.mutate({ userId: user.id, status: 'SUSPENDED' })}
                          disabled={statusMutation.isPending}
                        >
                          <ShieldBan className="w-3.5 h-3.5" /> Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 gap-1"
                          onClick={() => statusMutation.mutate({ userId: user.id, status: 'ACTIVE' })}
                          disabled={statusMutation.isPending}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Activate
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
