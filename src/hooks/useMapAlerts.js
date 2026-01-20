import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

export const useMapAlerts = () => {
  const queryClient = useQueryClient();

  // 1. FETCH ONLY ACTIVE ZONES (Resident View)
  const fetchActiveZones = async () => {
    // Generate ISO string (UTC) to compare against DB timestamps
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      // STRICT FILTER: Expire time must be greater than NOW
      .gt('expires_at', now)
      .not('affected_area', 'is', null) // Only ones with map zones
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: activeZones, isLoading: isLoadingZones } = useQuery({
    queryKey: ['mapActiveZones'],
    queryFn: fetchActiveZones,
    refetchInterval: 10000, // Check every 10s for expiration
  });

  // 2. CREATE MAP ALERT (Admin View)
  const createMapAlertMutation = useMutation({
  mutationFn: async ({ title, body, type, affectedArea, recipientIds, senderId, expiresAt }) => {
    const { data: alertData, error: alertError } = await supabase
      .from('alerts')
      .insert({
        title,
        body,
        category: type,
        expires_at: expiresAt,
        affected_area: affectedArea,
        recipient_ids: recipientIds,
        author_id: senderId,
        is_urgent: type === 'emergency',
      })
      .select()
      .single();

      if (alertError) throw alertError;

      // Notifications logic
      if (recipientIds.length > 0) {
        const notifications = recipientIds.map(id => ({
          recipient_id: id,
          sender_id: senderId,
          alert_id: alertData.id,
          title,
          body,
          type: type === 'emergency' ? 'urgent' : 'info',
          is_read: false
        }));

        const { error: notifError } = await supabase.from('notifications').insert(notifications);
        if (notifError) throw notifError;
      }

      return alertData;
    },
    onSuccess: () => {
      toast.success("Status Updated & Residents Notified");
      queryClient.invalidateQueries(['mapActiveZones']);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to update status");
    }
  });

  return {
    activeZones,
    isLoadingZones,
    createMapAlert: createMapAlertMutation.mutate,
    isCreating: createMapAlertMutation.isPending
  };
};
