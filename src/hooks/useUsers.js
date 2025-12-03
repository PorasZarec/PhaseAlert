import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient'; // Adjust path as needed
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
    staleTime: 1000 * 60 * 5, // Data is "fresh" for 5 minutes
  });

  // --- CREATE ---
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      const cleanedEmail = userData.email ? userData.email.trim() : "";
      if (!cleanedEmail) throw new Error("Email is required");

      // Invoke the Edge Function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: cleanedEmail,
          password: userData.password,
          full_name: userData.full_name,
          role: userData.role,
          phone: userData.phone
        }
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("User created successfully!");
      queryClient.invalidateQueries(['profiles']); // Refetch list automatically
    },
    onError: (error) => {
      toast.error(`Error creating user: ${error.message}`);
    }
  });

  // --- UPDATE ---
  const updateUserMutation = useMutation({
    mutationFn: async (userData) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          role: userData.role,
          address_block: userData.address_block,
          address_lot: userData.address_lot,
          phone: userData.phone
        })
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