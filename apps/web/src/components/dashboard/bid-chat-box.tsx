'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bidsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatCurrency } from '@/lib/utils';
import { Loader2, Send, MessageCircle, DollarSign, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  bidId: string;
  currentUserId: string;
  currentUserRole: 'SHIPPER' | 'DRIVER';
  /** Called after an offer is accepted (booking created) so parent can refresh */
  onOfferAccepted?: () => void;
  /** Unread count badge driven from outside */
  unreadCount?: number;
}

export function BidChatBox({ bidId, currentUserId, currentUserRole, onOfferAccepted }: Props) {
  const [open, setOpen]           = useState(false);
  const [text, setText]           = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerAmount, setOfferAmount]     = useState('');
  const [offerNote, setOfferNote]         = useState('');
  const bottomRef  = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const qKey = ['bid-chat', bidId];

  const { data: messages = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn:  () => bidsApi.getChatMessages(bidId),
    enabled:  open,
    refetchInterval: open ? 4000 : false,
  });

  const sendMsg = useMutation({
    mutationFn: (content: string) => bidsApi.sendChatMessage(bidId, content),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qKey }); setText(''); },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendOffer = useMutation({
    mutationFn: ({ amount, note }: { amount: number; note?: string }) =>
      bidsApi.sendOfferMessage(bidId, amount, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
      setShowOfferForm(false);
      setOfferAmount('');
      setOfferNote('');
      toast.success('Counter offer sent');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const respond = useMutation({
    mutationFn: ({ msgId, action }: { msgId: string; action: 'accept' | 'reject' }) =>
      bidsApi.respondToOffer(bidId, msgId, action),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: qKey });
      if (action === 'accept') {
        toast.success('Offer accepted — booking created!');
        onOfferAccepted?.();
      } else {
        toast.success('Offer declined');
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    sendMsg.mutate(t);
  };

  const handleSendOffer = () => {
    const amt = parseFloat(offerAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    sendOffer.mutate({ amount: amt, note: offerNote.trim() || undefined });
  };

  const pendingOfferMessages = messages.filter(
    (m: any) => m.messageType === 'counter_offer' && m.offerStatus === 'pending' && m.senderId !== currentUserId
  );
  const hasIncomingOffer = pendingOfferMessages.length > 0;

  return (
    <div className={cn('rounded-xl overflow-hidden border transition-colors', hasIncomingOffer ? 'border-amber-300' : 'border-gray-200')}>
      {/* Header */}
      <button
        onClick={() => setOpen(p => !p)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 transition-colors',
          hasIncomingOffer ? 'bg-amber-50 hover:bg-amber-100' : 'bg-white hover:bg-gray-50',
        )}
      >
        <span className={cn('flex items-center gap-2 font-semibold text-sm', hasIncomingOffer ? 'text-amber-800' : 'text-gray-800')}>
          <MessageCircle className={cn('w-4 h-4', hasIncomingOffer ? 'text-amber-500' : 'text-blue-500')} />
          Negotiate
          {hasIncomingOffer && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
              Counter offer!
            </span>
          )}
          {messages.length > 0 && !hasIncomingOffer && (
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{messages.length}</span>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {/* Message list */}
          <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {isLoading ? (
              <div className="flex justify-center pt-12"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-gray-400 pt-12">No messages yet — start the negotiation!</p>
            ) : (
              messages.map((msg: any) => {
                const isMine = msg.senderId === currentUserId;

                if (msg.messageType === 'counter_offer') {
                  const status = msg.offerStatus as 'pending' | 'accepted' | 'rejected';
                  const canRespond = !isMine && status === 'pending';

                  return (
                    <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[85%] rounded-2xl overflow-hidden border',
                        status === 'accepted' ? 'border-green-300' :
                        status === 'rejected' ? 'border-red-200 opacity-70' :
                        isMine ? 'border-blue-300' : 'border-amber-300',
                      )}>
                        {/* Offer card header */}
                        <div className={cn(
                          'px-4 py-2.5 flex items-center gap-2',
                          status === 'accepted' ? 'bg-green-50' :
                          status === 'rejected' ? 'bg-red-50' :
                          isMine ? 'bg-blue-50' : 'bg-amber-50',
                        )}>
                          <DollarSign className={cn('w-4 h-4 shrink-0',
                            status === 'accepted' ? 'text-green-600' :
                            status === 'rejected' ? 'text-red-400' :
                            isMine ? 'text-blue-600' : 'text-amber-600'
                          )} />
                          <div className="flex-1">
                            <p className={cn('text-[11px] font-semibold uppercase tracking-wide',
                              status === 'accepted' ? 'text-green-700' :
                              status === 'rejected' ? 'text-red-500' :
                              isMine ? 'text-blue-700' : 'text-amber-700',
                            )}>
                              {isMine ? 'Your offer' : `${currentUserRole === 'DRIVER' ? 'Shipper' : 'Driver'}'s offer`}
                              {status === 'accepted' && ' · Accepted'}
                              {status === 'rejected' && ' · Declined'}
                            </p>
                            <p className={cn('text-2xl font-extrabold leading-tight',
                              status === 'accepted' ? 'text-green-800' :
                              status === 'rejected' ? 'text-red-400' :
                              isMine ? 'text-blue-800' : 'text-amber-900',
                            )}>
                              {formatCurrency(msg.offerAmount)}
                            </p>
                          </div>
                        </div>

                        {/* Note */}
                        {msg.content && (
                          <div className="px-4 py-2 bg-white border-t border-gray-100 text-sm text-gray-600">
                            {msg.content.replace(/^(Driver|Shipper) (offered|countered at) \$[\d.]+( — )?/, '')}
                          </div>
                        )}

                        {/* Accept / Reject buttons */}
                        {canRespond && (
                          <div className="flex gap-2 px-4 py-3 bg-white border-t border-gray-100">
                            <Button
                              size="sm"
                              className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-xs"
                              disabled={respond.isPending}
                              onClick={() => respond.mutate({ msgId: msg.id, action: 'accept' })}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Accept {formatCurrency(msg.offerAmount)}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-1 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                              disabled={respond.isPending}
                              onClick={() => respond.mutate({ msgId: msg.id, action: 'reject' })}
                            >
                              <X className="w-3.5 h-3.5" />
                              Decline
                            </Button>
                          </div>
                        )}

                        <p className={cn('text-[10px] px-4 pb-2 pt-1',
                          status === 'accepted' ? 'text-green-500' : 'text-gray-400',
                        )}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Regular text message
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

          {/* Counter offer form */}
          {showOfferForm && (
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 space-y-2">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Send Counter Offer
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    className="pl-7 h-8 text-sm"
                    placeholder="Amount"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                  />
                </div>
                <Input
                  className="flex-1 h-8 text-sm"
                  placeholder="Note (optional)"
                  value={offerNote}
                  onChange={(e) => setOfferNote(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1 text-xs"
                  disabled={!offerAmount || sendOffer.isPending}
                  onClick={handleSendOffer}
                >
                  {sendOffer.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Offer
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowOfferForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className="flex items-center gap-2 p-3 bg-white border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowOfferForm(p => !p)}
              className="shrink-0 h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-amber-50 hover:border-amber-300 transition-colors flex items-center gap-1 text-xs text-gray-600"
            >
              <DollarSign className="w-3.5 h-3.5" /> Offer
            </button>
            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Message… (Enter to send)"
              className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!text.trim() || sendMsg.isPending}
              className="shrink-0 px-3"
            >
              {sendMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
