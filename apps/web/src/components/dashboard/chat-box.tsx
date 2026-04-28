'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Send, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  bookingId: string;
  currentUserId: string;
}

export function ChatBox({ bookingId, currentUserId }: Props) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat', bookingId],
    queryFn: () => bookingsApi.getMessages(bookingId),
    enabled: open,
    refetchInterval: open ? 8000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => bookingsApi.sendMessage(bookingId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', bookingId] });
      setText('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
          <MessageCircle className="w-4 h-4 text-blue-500" />
          Chat with {currentUserId ? 'Shipper' : 'Driver'}
          {messages.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {/* Message list */}
          <div className="h-52 sm:h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {isLoading ? (
              <div className="flex justify-center pt-10">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-gray-400 pt-10">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg: any) => {
                const isMine = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                    {!isMine && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 mr-2 shrink-0 mt-0.5">
                        {msg.sender?.profile?.firstName?.[0] ?? '?'}
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm',
                    )}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={cn('text-[10px] mt-1', isMine ? 'text-blue-200' : 'text-gray-400')}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 bg-white border-t border-gray-100">
            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message… (Enter to send)"
              className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!text.trim() || sendMutation.isPending}
              className="px-3 shrink-0"
            >
              {sendMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
