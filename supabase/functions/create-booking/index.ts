import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  freelancer_id: string;
  service_id?: string;
  start_time: string;
  end_time: string;
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

  // Admin client for privileged operations like sending notifications
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

    // Parse request body - supabase.functions.invoke sends body directly
    const body = await req.json();

    const freelancer_id = body?.freelancer_id ?? body?.freelancerId;
    const service_id = body?.service_id ?? body?.serviceId;
    const start_time = body?.start_time ?? body?.startTime;
    const end_time = body?.end_time ?? body?.endTime;
    const notes = body?.notes ?? body?.note ?? null;

    // Validate required fields
    if (!freelancer_id || !start_time || !end_time) {
      throw new Error("freelancer_id, start_time, and end_time are required");
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    
    if (endDate <= startDate) {
      throw new Error("end_time must be after start_time");
    }

    // Check if freelancer exists and get service details if provided
    let serviceData = null;
    let totalAmount = 0;

    if (service_id) {
      const { data: service, error: serviceError } = await supabaseClient
        .from("services")
        .select("*, profiles!services_freelancer_id_fkey(display_name)")
        .eq("id", service_id)
        .eq("freelancer_id", freelancer_id)
        .eq("is_active", true)
        .single();

      if (serviceError || !service) {
        throw new Error("Service not found or inactive");
      }

      serviceData = service;
      const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      totalAmount = Math.round(service.price_cents * durationHours);
    }

    // Check for conflicting bookings (overlap: start < requested end AND end > requested start)
    const { data: conflicts, error: conflictError } = await supabaseClient
      .from("bookings")
      .select("id")
      .eq("freelancer_id", freelancer_id)
      .in("status", ["pending", "confirmed"])
      .lt("start_time", end_time)
      .gt("end_time", start_time);

    if (conflictError) {
      throw new Error("Error checking availability");
    }

    if (conflicts && conflicts.length > 0) {
      throw new Error("Freelancer is not available during the requested time");
    }

    // Create the booking using admin client (bypasses RLS after user authentication)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        client_id: userData.user.id,
        freelancer_id,
        service_id: service_id || null,
        start_time,
        end_time,
        total_amount_cents: totalAmount > 0 ? totalAmount : null,
        notes,
        status: "pending"
      })
      .select(`
        *,
        freelancer:profiles!bookings_freelancer_id_fkey(display_name, avatar_url),
        service:services(title, description)
      `)
      .single();

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    // Create notification for freelancer using admin client (bypasses RLS)
    const { error: notifError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: freelancer_id,
        type: "booking_request",
        payload: {
          booking_id: booking.id,
          client_name: userData.user.user_metadata?.display_name || userData.user.email,
          service_title: serviceData?.title || "Custom booking",
          start_time,
          end_time
        }
      });

    if (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    return new Response(JSON.stringify({
      success: true,
      booking,
      message: "Booking created successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });

  } catch (error) {
    console.error("Error creating booking:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});