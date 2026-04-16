'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { Mail, Loader2, MailOpen, Search, Building2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contact-messages', unreadOnly],
    queryFn: () => adminApi.contactMessages({ unreadOnly }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminApi.markContactRead(id),
    onMutate: async (id: string) => {
      // Optimistically flip read=true in place — message stays in the list
      await queryClient.cancelQueries({ queryKey: ['admin-contact-messages'] });
      queryClient.setQueriesData({ queryKey: ['admin-contact-messages'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((m: any) => (m.id === id ? { ...m, read: true } : m)),
        };
      });
    },
    onSuccess: () => {
      // Only refresh the stats badge count
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: () => {
      // Revert on failure
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
    },
  });

  const messages = (data?.data ?? []).filter((m: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.firstName?.toLowerCase().includes(q) ||
      m.lastName?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q) ||
      m.message?.toLowerCase().includes(q)
    );
  });

  const unreadCount = (data?.data ?? []).filter((m: any) => !m.read).length;

  return (
    <div>
      <PageHeader
        title="Contact Messages"
        description="Inbound messages from the public contact form"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or subject..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setUnreadOnly((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            unreadOnly ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          Unread only
          {unreadCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${unreadOnly ? 'bg-white text-blue-600' : 'bg-red-100 text-red-600'}`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
        </div>
      ) : !messages.length ? (
        <div className="text-center py-20 text-gray-400">
          <MailOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">{unreadOnly ? 'No unread messages' : 'No messages yet'}</p>
          <p className="text-sm mt-1">Messages from the contact form will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg: any) => {
            const isExpanded = expandedId === msg.id;
            return (
              <div
                key={msg.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                  msg.read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'
                }`}
              >
                {/* Header row */}
                <button
                  className="w-full p-4 sm:p-5 text-left flex items-start gap-4"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : msg.id);
                    if (!msg.read) markReadMutation.mutate(msg.id);
                  }}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    msg.read ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {msg.firstName?.[0]}{msg.lastName?.[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">
                        {msg.firstName} {msg.lastName}
                      </span>
                      {!msg.read && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">New</span>
                      )}
                      {msg.company && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {msg.company}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {msg.email}
                    </p>
                    <p className={`text-sm mt-1 ${msg.read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                      {msg.subject}
                    </p>
                    {!isExpanded && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{msg.message}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" /> {formatDate(msg.createdAt)}
                    </p>
                  </div>
                </button>

                {/* Expanded message body */}
                {isExpanded && (
                  <div className="px-5 pb-5">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Message</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" /> Reply via Email
                      </a>
                      {!msg.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markReadMutation.mutate(msg.id)}
                          disabled={markReadMutation.isPending}
                          className="gap-2"
                        >
                          <MailOpen className="w-3.5 h-3.5" /> Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
