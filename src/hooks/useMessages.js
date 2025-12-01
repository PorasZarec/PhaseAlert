import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { useEffect } from 'react';
import { toast } from 'sonner';

// --- FETCHER FUNCTION ---
const fetchMessages = async ({ queryKey }) => {
  const [_, { tab, currentUserId, otherUserId }] = queryKey;
  
  if (!currentUserId) return [];

  // 1. Base Query
  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey (id, full_name, role, avatar_url),
      receiver:profiles!messages_receiver_id_fkey (id, full_name, role)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  // 2. Apply Logic based on Tab
  if (tab === 'community') {
    // Community: Receiver is NULL
    query = query.is('receiver_id', null);
  } 
  else if (tab === 'admin_support') {
    // Resident View: Chats with ANY Admin
    query = query.or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
  } 
  else if (tab === 'direct' && otherUserId) {
    // Admin View: Direct Chat with Specific Resident
    query = query.or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error("Fetch Messages Error:", error);
    throw error;
  }

  // Client-side filtering for Resident Support tab
  if (tab === 'admin_support' && data) {
    return data.filter(msg => msg.receiver_id !== null).reverse();
  }

  return data ? data.reverse() : [];
};

// --- HOOK ---
export const useMessages = (tab, currentUserId, otherUserId = null) => {
  const queryClient = useQueryClient();
  const queryKey = ['messages', { tab, currentUserId, otherUserId }];

  const { data: messages, isLoading } = useQuery({
    queryKey,
    queryFn: fetchMessages,
    enabled: !!currentUserId && (tab !== 'direct' || !!otherUserId),
    staleTime: 0, 
  });

  // Realtime Subscription
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`realtime:messages:${tab}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries(queryKey);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tab, currentUserId, otherUserId, queryClient]);

  // Send Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, receiverId }) => {
      const { error } = await supabase.from('messages').insert({
        content,
        sender_id: currentUserId,
        receiver_id: receiverId || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
    },
    onError: (err) => {
      console.error("Send Error:", err);
      toast.error("Failed to send message");
    }
  });

  return {
    messages: messages || [],
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending
  };
};