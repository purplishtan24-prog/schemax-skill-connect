import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id: string;
  type: string;
  payload: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key for admin operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Get authenticated user for permission check
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Authentication required");
    }

    const { user_id, type, payload }: NotificationRequest = await req.json();

    if (!user_id || !type || !payload) {
      throw new Error("user_id, type, and payload are required");
    }

    // Create notification using admin client to bypass RLS
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id,
        type,
        payload,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (notificationError) {
      throw new Error(`Failed to create notification: ${notificationError.message}`);
    }

    // Here you could integrate with external services like:
    // - Push notifications (Firebase, OneSignal)
    // - Email notifications (SendGrid, Resend)
    // - SMS notifications (Twilio)
    
    console.log(`Notification sent to user ${user_id}: ${type}`, payload);

    return new Response(JSON.stringify({
      success: true,
      notification,
      message: "Notification sent successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });

  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});