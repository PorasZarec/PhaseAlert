import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

export const useAlerts = () => {
  const queryClient = useQueryClient();

  // --- FETCH ALERTS ---
  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select(`*, profiles:author_id (full_name)`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });

  // --- CREATE ALERT ---
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
      console.error(error);
      toast.error(`Error creating alert: ${error.message}`);
    },
  });

  // --- UPDATE ALERT ---
  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('alerts')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      toast.success('Alert updated successfully');
    },
    onError: (error) => {
      console.error(error);
      toast.error(`Error updating alert: ${error.message}`);
    },
  });

  // --- DELETE ALERT ---
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
      console.error(error);
      toast.error(`Error deleting alert: ${error.message}`);
    },
  });

  return {
    alerts: alerts || [],
    isLoading,
    error,
    createAlert: createAlertMutation.mutateAsync,
    updateAlert: updateAlertMutation.mutateAsync,
    deleteAlert: deleteAlertMutation.mutateAsync,
    isCreating: createAlertMutation.isPending,
    isUpdating: updateAlertMutation.isPending,
    isDeleting: deleteAlertMutation.isPending,
  };
};
