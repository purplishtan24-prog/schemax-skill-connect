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

    // Build the base query for freelancers (don't filter by search_query yet)
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
        verifications(
          status
        )
      `)
      .eq("role", "freelancer")
      .eq("is_public", true);

    // Apply non-text filters
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

    // Fetch reviews separately to avoid relationship conflicts
    const freelancerIds = freelancers?.map(f => f.id) || [];
    let reviewsData: any[] = [];
    
    if (freelancerIds.length > 0) {
      const { data: reviews, error: reviewsError } = await supabaseClient
        .from("reviews")
        .select("freelancer_id, rating, comment, created_at")
        .in("freelancer_id", freelancerIds);
      
      if (!reviewsError) {
        reviewsData = reviews || [];
      }
    }

    // Post-process results to add computed fields and apply additional filters
    const processedFreelancers = freelancers?.map(freelancer => {
      // Get reviews for this freelancer
      const reviews = reviewsData.filter(r => r.freelancer_id === freelancer.id);
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
      
      // Search query filter (check name, bio, and service titles)
      if (filters.search_query) {
        const searchTerm = filters.search_query.toLowerCase();
        const nameMatch = freelancer.display_name?.toLowerCase().includes(searchTerm);
        const bioMatch = freelancer.bio?.toLowerCase().includes(searchTerm);
        const serviceMatch = freelancer.services?.some((service: any) => 
          service.title?.toLowerCase().includes(searchTerm) ||
          service.description?.toLowerCase().includes(searchTerm)
        );
        
        if (!nameMatch && !bioMatch && !serviceMatch) {
          return false;
        }
      }
      
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

    // Initialize available freelancers with processed results
    let availableFreelancers = processedFreelancers;

    // If availability filter is provided, check availability slots
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

    // Apply search relevance scoring if search query exists
    if (filters.search_query) {
      const searchTerm = filters.search_query.toLowerCase();
      availableFreelancers.forEach(freelancer => {
        let relevanceScore = 0;
        
        // Title relevance (highest priority)
        const serviceMatches = freelancer.services?.filter((service: any) => 
          service.title.toLowerCase().includes(searchTerm)
        ).length || 0;
        relevanceScore += serviceMatches * 10;
        
        // Name relevance
        if (freelancer.display_name?.toLowerCase().includes(searchTerm)) {
          relevanceScore += 5;
        }
        
        // Bio relevance
        if (freelancer.bio?.toLowerCase().includes(searchTerm)) {
          relevanceScore += 2;
        }
        
        freelancer.relevance_score = relevanceScore;
      });
      
      // Sort by relevance first, then by verification and rating
      availableFreelancers.sort((a, b) => {
        if (a.relevance_score !== b.relevance_score) {
          return b.relevance_score - a.relevance_score;
        }
        if (a.is_verified !== b.is_verified) {
          return b.is_verified ? 1 : -1;
        }
        return b.avg_rating - a.avg_rating;
      });
    } else {
      // Sort by rating and verification status when no search query
      availableFreelancers.sort((a, b) => {
        if (a.is_verified !== b.is_verified) {
          return b.is_verified ? 1 : -1;
        }
        return b.avg_rating - a.avg_rating;
      });
    }

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