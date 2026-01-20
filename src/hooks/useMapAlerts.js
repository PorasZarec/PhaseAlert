import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

export const useMapAlerts = () => {
  const queryClient = useQueryClient();

  const fetchActiveZones = async () => {
    const now = new Date().toISOString();
    // Only fetch alerts that have NOT expired and have coordinates
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .gt('expires_at', now)
      .not('affected_area', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: activeZones, isLoading: isLoadingZones } = useQuery({
    queryKey: ['mapActiveZones'],
    queryFn: fetchActiveZones,
    refetchInterval: 30000, // Check every 30s to auto-remove expired zones
  });

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
