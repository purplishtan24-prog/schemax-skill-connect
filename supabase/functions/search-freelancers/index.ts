import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchFilters {
  skills?: string[];
  location?: string;
  min_rate?: number;
  max_rate?: number;
  availability_start?: string;
  availability_end?: string;
  rating_min?: number;
  verified_only?: boolean;
  search_query?: string;
  limit?: number;
  offset?: number;
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
    const url = new URL(req.url);
    const filters: SearchFilters = {
      skills: url.searchParams.get("skills")?.split(",").filter(Boolean),
      location: url.searchParams.get("location") || undefined,
      min_rate: url.searchParams.get("min_rate") ? parseInt(url.searchParams.get("min_rate")!) : undefined,
      max_rate: url.searchParams.get("max_rate") ? parseInt(url.searchParams.get("max_rate")!) : undefined,
      availability_start: url.searchParams.get("availability_start") || undefined,
      availability_end: url.searchParams.get("availability_end") || undefined,
      rating_min: url.searchParams.get("rating_min") ? parseFloat(url.searchParams.get("rating_min")!) : undefined,
      verified_only: url.searchParams.get("verified_only") === "true",
      search_query: url.searchParams.get("q") || undefined,
      limit: Math.min(parseInt(url.searchParams.get("limit") || "20"), 50),
      offset: parseInt(url.searchParams.get("offset") || "0")
    };

    // Build the base query for freelancers
    let query = supabaseClient
      .from("profiles")
      .select(`
        *,
        freelancer_skills(
          skill:skills(id, name)
        ),
        services(
          id,
          title,
          description,
          price_cents,
          duration_minutes,
          is_active
        ),
        reviews(
          rating,
          comment,
          created_at
        ),
        verifications(
          status
        )
      `)
      .eq("role", "freelancer")
      .eq("is_public", true);

    // Apply filters
    if (filters.search_query) {
      query = query.or(`display_name.ilike.%${filters.search_query}%,bio.ilike.%${filters.search_query}%`);
    }

    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }

    if (filters.min_rate !== undefined) {
      query = query.gte("hourly_rate", filters.min_rate);
    }

    if (filters.max_rate !== undefined) {
      query = query.lte("hourly_rate", filters.max_rate);
    }

    const { data: freelancers, error } = await query
      .range(filters.offset, filters.offset + filters.limit - 1);

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    // Post-process results to add computed fields and apply additional filters
    const processedFreelancers = freelancers?.map(freelancer => {
      // Calculate average rating
      const reviews = freelancer.reviews || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
        : 0;

      // Check verification status
      const isVerified = freelancer.verifications?.some((v: any) => v.status === "verified") || false;

      // Get skills
      const skills = freelancer.freelancer_skills?.map((fs: any) => fs.skill) || [];

      // Filter active services
      const activeServices = freelancer.services?.filter((s: any) => s.is_active) || [];

      return {
        ...freelancer,
        avg_rating: Number(avgRating.toFixed(1)),
        review_count: reviews.length,
        is_verified: isVerified,
        skills,
        services: activeServices,
        reviews: reviews.slice(0, 3) // Limit to recent reviews
      };
    }).filter(freelancer => {
      // Apply post-processing filters
      
      // Rating filter
      if (filters.rating_min && freelancer.avg_rating < filters.rating_min) {
        return false;
      }

      // Verification filter
      if (filters.verified_only && !freelancer.is_verified) {
        return false;
      }

      // Skills filter
      if (filters.skills && filters.skills.length > 0) {
        const freelancerSkills = freelancer.skills.map((s: any) => s.name.toLowerCase());
        const hasRequiredSkills = filters.skills.some(skill => 
          freelancerSkills.includes(skill.toLowerCase())
        );
        if (!hasRequiredSkills) {
          return false;
        }
      }

      return true;
    }) || [];

    // If availability filter is provided, check availability slots
    let availableFreelancers = processedFreelancers;
    if (filters.availability_start && filters.availability_end) {
      const availabilityPromises = processedFreelancers.map(async (freelancer) => {
        const { data: slots, error: slotError } = await supabaseClient
          .from("availability_slots")
          .select("*")
          .eq("freelancer_id", freelancer.id)
          .eq("is_booked", false)
          .gte("start_time", filters.availability_start)
          .lte("end_time", filters.availability_end);

        if (slotError || !slots || slots.length === 0) {
          return null;
        }

        return { ...freelancer, available_slots: slots };
      });

      const results = await Promise.all(availabilityPromises);
      availableFreelancers = results.filter(Boolean);
    }

    // Sort by rating and verification status
    availableFreelancers.sort((a, b) => {
      if (a.is_verified !== b.is_verified) {
        return b.is_verified ? 1 : -1;
      }
      return b.avg_rating - a.avg_rating;
    });

    return new Response(JSON.stringify({
      success: true,
      freelancers: availableFreelancers,
      total: availableFreelancers.length,
      filters: filters
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error searching freelancers:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});