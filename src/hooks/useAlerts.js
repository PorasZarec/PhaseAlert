import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

export const useAlerts = () => {
  const queryClient = useQueryClient();

  // --- FETCH ALERTS ---
  const fetchAlerts = async () => {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('alerts')
      .select(`*, profiles:author_id (full_name)`)
      // Show active alerts OR alerts with no expiration date
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 30000,
  });

  // --- CLEANUP (DELETE EXPIRED) ---
  const purgeExpiredAlerts = async () => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('alerts')
        .delete()
        .lt('expires_at', now);

      if (error) throw error;
      queryClient.invalidateQueries(['alerts']);
    } catch (err) {
      console.error("Failed to purge expired alerts:", err);
    }
  };

  // --- CREATE (With Broadcast Notification) ---
  const createAlertMutation = useMutation({
    mutationFn: async (newAlert) => {
      // 1. Fetch ALL resident IDs to send notifications to
      const { data: allResidents, error: residentsError } = await supabase
        .from('profiles')
        .select('id');

      if (residentsError) throw residentsError;

      // 2. Insert the Alert into the 'alerts' table
      // Note: We leave 'recipient_ids' null here, implying a "Global/Public" alert
      const { data: alertData, error: alertError } = await supabase
        .from('alerts')
        .insert([newAlert])
        .select()
        .single();

      if (alertError) throw alertError;

      // 3. Create Notification entries for EVERY resident
      if (allResidents && allResidents.length > 0) {
        const notifications = allResidents.map((resident) => ({
          recipient_id: resident.id,      // The resident receiving the alert
          sender_id: newAlert.author_id,  // The admin who posted it
          alert_id: alertData.id,         // Link to the specific alert
          title: newAlert.title,
          body: newAlert.body,
          type: newAlert.is_urgent ? 'urgent' : 'info',
          is_read: false,
          created_at: new Date().toISOString()
        }));

        // Bulk insert notifications
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error("Failed to send notifications:", notifError);
          // We don't throw here to avoid failing the whole process if just notifications fail
          // but we log it for debugging.
        }
      }

      return alertData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      toast.success('Alert posted & notifications sent to all residents');
    },
    onError: (error) => {
      toast.error(`Error creating alert: ${error.message}`);
    },
  });

  // --- UPDATE (No notifications sent, as requested) ---
  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase.from('alerts').update(updates).eq('id', id).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      toast.success('Alert updated successfully');
    },
    onError: (error) => {
      toast.error(`Error updating: ${error.message}`);
    },
  });

  // --- DELETE ---
  const deleteAlertMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('alerts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      toast.success('Alert deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting: ${error.message}`);
    },
  });

  return {
    alerts: alerts || [],
    isLoading,
    error,
    createAlert: createAlertMutation.mutateAsync,
    updateAlert: updateAlertMutation.mutateAsync,
    deleteAlert: deleteAlertMutation.mutateAsync,
    purgeExpiredAlerts,
    isCreating: createAlertMutation.isPending,
    isUpdating: updateAlertMutation.isPending,
    isDeleting: deleteAlertMutation.isPending,
  };
};
