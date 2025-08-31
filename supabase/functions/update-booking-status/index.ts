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

  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Authentication required");
    }

    const { booking_id, status, notes }: UpdateBookingRequest = await req.json();

    if (!booking_id || !status) {
      throw new Error("booking_id and status are required");
    }

    // Get current booking
    const { data: currentBooking, error: fetchError } = await supabaseClient
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

    // Update booking
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (notes) {
      updateData.notes = notes;
    }

    const { data: updatedBooking, error: updateError } = await supabaseClient
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
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    // Create notifications
    const notificationPromises = [];
    
    if (isFreelancer) {
      // Notify client
      notificationPromises.push(
        supabaseClient.from("notifications").insert({
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
        supabaseClient.from("notifications").insert({
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