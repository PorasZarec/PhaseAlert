import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

export const useUsers = () => {
  const queryClient = useQueryClient();

  // --- READ ---
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // --- CREATE ---
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      // 1. Sanitize Data
      const payload = {
        email: userData.email.trim(),
        password: userData.password,
        full_name: userData.full_name,
        role: userData.role,
        phone: userData.phone || null,
        address_block: userData.address_block ? parseInt(userData.address_block) : null,
        address_lot: userData.address_lot ? parseInt(userData.address_lot) : null
      };

      // 2. Call Edge Function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: payload
      });

      // 3. Handle Errors (WITHOUT Toasting here)
      if (error) {
        console.error("Create User API Error:", error);

        // Attempt to read the specific error message from the response logic
        // If it's that generic "non-2xx" error, we try to provide a better guess
        if (error.message && error.message.includes("non-2xx")) {
             throw new Error("Creation failed. Email might be duplicate or password too short.");
        }

        // Otherwise throw the actual error message
        throw new Error(error.message || "Failed to create user");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("User created successfully!");
      queryClient.invalidateQueries(['profiles']);
    },
    onError: (error) => {
      // ONLY toast here. This prevents the "Double Toast" issue.
      toast.error(error.message);
    }
  });

  // --- UPDATE ---
  const updateUserMutation = useMutation({
    mutationFn: async (userData) => {
      const updates = {
        full_name: userData.full_name,
        role: userData.role,
        address_block: userData.address_block || null,
        address_lot: userData.address_lot || null,
        phone: userData.phone,
        // Only update location if explicitly provided
        ...(userData.latitude !== undefined && { latitude: userData.latitude }),
        ...(userData.longitude !== undefined && { longitude: userData.longitude }),
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', userData.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries(['profiles']);
    },
    onError: (err) => toast.error(err.message)
  });

  // --- DELETE ---
    const deleteUserMutation = useMutation({
      mutationFn: async (userId) => {
        const { data, error } = await supabase.functions.invoke('delete-user', {
          body: { user_id: userId }
        });

        // 2. STOP if there is an error. Do NOT fall back to DB delete.
        if (error) {
          console.error("Full Error Object:", error);

          // Try to read the error message from the response if possible
          let msg = error.message;
          if (error instanceof Error) msg = error.message;
          // Supabase functions sometimes wrap the real error in a 'context'
          if (msg === "Edge Function returned a non-2xx status code") {
               // This is the generic wrapper. We need to trust the logs or the console.
               msg = "Server failed to delete Auth User. Check Edge Function Logs.";
          }

          throw new Error(msg);
        }

        return data;
      },
      onSuccess: () => {
        toast.success("User account PERMANENTLY deleted");
        queryClient.invalidateQueries(['profiles']);
      },
      onError: (err) => {
        // This will now show the REAL error
        toast.error(err.message);
      }
    });

  return {
    users,
    isLoading,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isDeleting: deleteUserMutation.isPending,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
  };
};
