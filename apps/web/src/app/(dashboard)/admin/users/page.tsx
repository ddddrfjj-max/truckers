'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { Users, Search, Loader2, ShieldBan, ShieldCheck, ShieldPlus, UserPlus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createAdmin(form),
    onSuccess: () => {
      toast.success('Admin account created');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Create Admin Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">First Name</label>
              <Input
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Last Name</label>
              <Input
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
            <Input
              type="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
            <Input
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !form.email || !form.password || !form.firstName || !form.lastName}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Admin'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isDeveloper = session?.user?.role === 'DEVELOPER';

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

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.setUserRole(userId, role),
    onSuccess: (_, vars) => {
      toast.success(`User promoted to ${vars.role}`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      toast.success('Account deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmDelete = (user: any) => {
    if (window.confirm(`Delete account for ${user.email}? This cannot be undone.`)) {
      deleteMutation.mutate(user.id);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="Users" description={`${data?.total ?? 0} total users`} />
        {isDeveloper && (
          <Button
            className="bg-purple-600 hover:bg-purple-700 gap-2 shrink-0"
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus className="w-4 h-4" /> Create Admin
          </Button>
        )}
      </div>

      {showCreateModal && <CreateAdminModal onClose={() => setShowCreateModal(false)} />}

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
          <option value="DEVELOPER">Developers</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : !data?.data?.length ? (
        <EmptyState icon={Users} title="No users found" description="No users match your search" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
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
                      user.role === 'DEVELOPER' ? 'bg-red-100 text-red-700' :
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
                    {user.role === 'DEVELOPER' ? null : (
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Promote to admin — DEVELOPER only, non-admin rows */}
                        {isDeveloper && user.role !== 'ADMIN' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-800 gap-1"
                            onClick={() => roleMutation.mutate({ userId: user.id, role: 'ADMIN' })}
                            disabled={roleMutation.isPending}
                          >
                            <ShieldPlus className="w-3.5 h-3.5" /> Make Admin
                          </Button>
                        )}

                        {/* Suspend / Activate */}
                        {(user.role !== 'ADMIN' || isDeveloper) && (
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

                        {/* Delete — DEVELOPER only */}
                        {isDeveloper && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 gap-1"
                            onClick={() => confirmDelete(user)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
