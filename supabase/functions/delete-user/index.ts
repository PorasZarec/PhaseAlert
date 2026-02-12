// supabase/functions/delete-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS (Browser pre-flight checks)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Initialize Supabase Admin Client
    // We explicitly log if the key is missing to help debugging
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!")
      throw new Error("Server configuration error: Missing Service Key")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    )

    // 3. Parse Data
    const { user_id } = await req.json()

    if (!user_id) {
      throw new Error("Missing user_id in request body")
    }

    // 4. Delete from Auth (The Important Part)
    const { data, error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (authError) {
      console.error("Auth Delete Failed:", authError)
      throw new Error(`Auth Error: ${authError.message}`)
    }

    // 5. Delete from Public Profile (Cleanup)
    const { error: dbError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user_id)

    if (dbError) {
      console.error("Profile Delete Failed:", dbError)
      // We don't throw here, because the Auth user is already gone, which is the important part.
    }
    return new Response(JSON.stringify({ message: "User deleted successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Edge Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
