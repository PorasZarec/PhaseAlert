import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

export const useMapAlerts = () => {
  const queryClient = useQueryClient();

  // 1. FETCH ONLY ACTIVE ZONES (For the Map Overlay)
  // This is specific to the map: we only care about future alerts with coordinates.
  const fetchActiveZones = async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .gt('expires_at', now) // Only active alerts
      .not('affected_area', 'is', null) // Only ones with map zones
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: activeZones, isLoading: isLoadingZones } = useQuery({
    queryKey: ['mapActiveZones'],
    queryFn: fetchActiveZones,
    refetchInterval: 10000, // <--- NEW: Check for expired alerts every 10 seconds
  });

  // 2. CREATE MAP ALERT (The "Status" Update)
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

      // B. Create Notifications for each user
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
      queryClient.invalidateQueries(['mapActiveZones']); // Refresh the map immediately
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
