import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

export const useAlerts = () => {
  const queryClient = useQueryClient();

  // --- FETCH ALERTS ---
  // We still filter here visually so the UI is instant, even before deletion happens
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
  // This will be called by the Admin Dashboard to clean the DB
  const purgeExpiredAlerts = async () => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('alerts')
        .delete()
        .lt('expires_at', now); // Delete anything less than NOW

      if (error) throw error;
      queryClient.invalidateQueries(['alerts']);
    } catch (err) {
      console.error("Failed to purge expired alerts:", err);
    }
  };

  // --- CREATE ---
  const createAlertMutation = useMutation({
    mutationFn: async (newAlert) => {
      const { data, error } = await supabase.from('alerts').insert([newAlert]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      toast.success('Alert created successfully');
    },
    onError: (error) => {
      toast.error(`Error creating: ${error.message}`);
    },
  });

  // --- UPDATE ---
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
    purgeExpiredAlerts, // <--- Exported function
    isCreating: createAlertMutation.isPending,
    isUpdating: updateAlertMutation.isPending,
    isDeleting: deleteAlertMutation.isPending,
  };
};
