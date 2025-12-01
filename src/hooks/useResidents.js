import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

// --- FETCHER FUNCTION ---
const fetchResidents = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, address_block, address_lot, latitude, longitude')
    .eq('role', 'resident');

  if (error) throw error;
  return data;
};

// --- CUSTOM HOOK ---
export const useResidents = () => {
  const queryClient = useQueryClient();

  // 1. READ (Fetch Residents)
  const query = useQuery({
    queryKey: ['residents'],
    queryFn: fetchResidents,
    staleTime: 0,            // <--- (Always fetch new data)
    refetchInterval: 3000,   // <--- heck every 3 seconds
  });

  // 2. UPDATE (Save Location)
  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, latitude, longitude }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ latitude, longitude })
        .eq('id', id);
      if (error) throw error;
      return { id, latitude, longitude };
    },
    onSuccess: (newItem) => {
      toast.success("Location updated successfully");
      // Instant Update: Update the cache immediately without waiting for a re-fetch
      queryClient.setQueryData(['residents'], (oldData) => 
        oldData.map(r => r.id === newItem.id ? { ...r, ...newItem } : r)
      );
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return {
    residents: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    updateLocation: updateLocationMutation.mutate,
    isUpdating: updateLocationMutation.isPending
  };
};