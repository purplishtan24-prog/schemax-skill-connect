import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateBookingRequest {
  booking_id: string;
  status: "confirmed" | "canceled" | "completed";
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Admin client for privileged operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Authentication required");
    }

    // Support both direct JSON body and { body: { ... } } shapes
    const raw = await req.json().catch(() => null as unknown);
    const body: any = raw && typeof raw === 'object' && 'body' in (raw as any) ? (raw as any).body : raw;
    
    let booking_id = body?.booking_id ?? body?.bookingId;
    let status = body?.status;
    const notes = body?.notes;

    // Normalize 'rejected' to 'canceled' for database
    if (status === 'rejected') {
      status = 'canceled';
    }

    if (!booking_id || !status) {
      throw new Error("booking_id and status are required");
    }

    // Get current booking using admin client
    const { data: currentBooking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        freelancer:profiles!bookings_freelancer_id_fkey(display_name),
        client:profiles!bookings_client_id_fkey(display_name),
        service:services(title)
      `)
      .eq("id", booking_id)
      .single();

    if (fetchError || !currentBooking) {
      console.error("Booking fetch error:", fetchError);
      throw new Error("Booking not found");
    }

    // Check permissions
    const isFreelancer = userData.user.id === currentBooking.freelancer_id;
    const isClient = userData.user.id === currentBooking.client_id;

    if (!isFreelancer && !isClient) {
      throw new Error("Unauthorized: You can only update your own bookings");
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed", "canceled"],
      confirmed: ["completed", "canceled"],
      completed: [],
      canceled: []
    };

    // If already in the desired status, return success without error
    if (currentBooking.status === status) {
      return new Response(JSON.stringify({
        success: true,
        booking: currentBooking,
        message: `Booking is already ${status}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!validTransitions[currentBooking.status]?.includes(status)) {
      throw new Error(`Cannot change status from ${currentBooking.status} to ${status}`);
    }

    // Only freelancers can confirm bookings, both can cancel
    if (status === "confirmed" && !isFreelancer) {
      throw new Error("Only freelancers can confirm bookings");
    }

    // Only clients or freelancers can mark as completed after completion
    if (status === "completed" && currentBooking.status !== "confirmed") {
      throw new Error("Booking must be confirmed before marking as completed");
    }

    // Update booking using admin client
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (notes) {
      updateData.notes = notes;
    }

    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from("bookings")
      .update(updateData)
      .eq("id", booking_id)
      .select(`
        *,
        freelancer:profiles!bookings_freelancer_id_fkey(display_name),
        client:profiles!bookings_client_id_fkey(display_name),
        service:services(title)
      `)
      .single();

    if (updateError) {
      console.error("Booking update error:", updateError);
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    // Delete the original booking_request notification for the freelancer if they responded
    if (isFreelancer && (status === 'confirmed' || status === 'canceled')) {
      // Fetch and delete all booking_request notifications for this booking
      const { data: notificationsToDelete, error: fetchNotifError } = await supabaseAdmin
        .from('notifications')
        .select('id, payload')
        .eq('user_id', currentBooking.freelancer_id)
        .eq('type', 'booking_request');
      
      if (!fetchNotifError && notificationsToDelete) {
        const notificationIdsToDelete = notificationsToDelete
          .filter(n => n.payload?.booking_id === booking_id)
          .map(n => n.id);
        
        if (notificationIdsToDelete.length > 0) {
          const { error: deleteError } = await supabaseAdmin
            .from('notifications')
            .delete()
            .in('id', notificationIdsToDelete);
          
          if (deleteError) {
            console.error('Error deleting notification:', deleteError);
          }
        }
      }
    }

    // Create notifications using admin client
    const notificationPromises = [];
    
    if (isFreelancer) {
      // Notify client
      notificationPromises.push(
        supabaseAdmin.from("notifications").insert({
          user_id: currentBooking.client_id,
          type: `booking_${status}`,
          payload: {
            booking_id,
            freelancer_name: currentBooking.freelancer.display_name,
            service_title: currentBooking.service?.title || "Custom booking",
            status,
            start_time: currentBooking.start_time,
            message: `Your booking has been ${status}`
          }
        })
      );
    } else {
      // Notify freelancer
      notificationPromises.push(
        supabaseAdmin.from("notifications").insert({
          user_id: currentBooking.freelancer_id,
          type: `booking_${status}`,
          payload: {
            booking_id,
            client_name: currentBooking.client.display_name,
            service_title: currentBooking.service?.title || "Custom booking",
            status,
            start_time: currentBooking.start_time,
            message: `Booking has been ${status} by client`
          }
        })
      );
    }

    await Promise.all(notificationPromises);

    return new Response(JSON.stringify({
      success: true,
      booking: updatedBooking,
      message: `Booking ${status} successfully`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error updating booking:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});