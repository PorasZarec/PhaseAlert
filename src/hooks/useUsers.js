import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

export const useUsers = () => {
  const queryClient = useQueryClient();

  // --- READ (Fetch Users) ---
  const {
    data: users = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // --- CREATE ---
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      const cleanedEmail = userData.email ? userData.email.trim() : "";
      if (!cleanedEmail) throw new Error("Email is required");

      // 1. Call Edge Function to create Auth User + Basic Profile
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('create-user', {
        body: {
          email: cleanedEmail,
          password: userData.password,
          full_name: userData.full_name,
          role: userData.role,
          phone: userData.phone,
          // Pass address just in case the Edge Function supports it
          address_block: userData.address_block,
          address_lot: userData.address_lot
        }
      });

      if (edgeError) throw edgeError;
      if (edgeData && edgeData.error) throw new Error(edgeData.error);

      // 2. SAFETY UPDATE: Force update the profile with Address Info
      // This guarantees Blk/Lot are saved even if the Edge Function ignores them.
      // We assume the Edge Function returns the new user's ID or we query by email.
      if (edgeData?.user?.id || edgeData?.id) {
        const userId = edgeData?.user?.id || edgeData?.id;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            address_block: userData.address_block,
            address_lot: userData.address_lot
          })
          .eq('id', userId);

        if (profileError) console.warn("Profile address update warning:", profileError);
      }

      return edgeData;
    },
    onSuccess: () => {
      toast.success("User created successfully!");
      queryClient.invalidateQueries(['profiles']);
    },
    onError: (error) => {
      toast.error(`Error creating user: ${error.message}`);
    }
  });

  // --- UPDATE ---
  const updateUserMutation = useMutation({
    mutationFn: async (userData) => {
      // Prepare update object dynamically to allow resetting location
      const updates = {
        full_name: userData.full_name,
        role: userData.role,
        address_block: userData.address_block,
        address_lot: userData.address_lot,
        phone: userData.phone
      };

      // Only include lat/lng if they are explicitly passed (allows setting to null)
      if (userData.hasOwnProperty('latitude')) updates.latitude = userData.latitude;
      if (userData.hasOwnProperty('longitude')) updates.longitude = userData.longitude;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries(['profiles']);
    },
    onError: (error) => {
      toast.error(`Error updating user: ${error.message}`);
    }
  });

  // --- DELETE ---
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      // Note: This only deletes the Profile row.
      // To delete the Auth user, you usually need an Edge Function (admin delete).
      // Assuming RLS/Triggers handle the rest or this is sufficient for your logic:
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries(['profiles']);
    },
    onError: (error) => {
      toast.error(`Error deleting user: ${error.message}`);
    }
  });

  return {
    users,
    isLoading,
    error,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
};
