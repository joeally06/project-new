import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const allowedOrigins = [
  'https://tapt.org',
  'https://admin.tapt.org',
  'http://localhost:5173'
];

// Utility to sanitize error messages
const sanitizeError = (error: any): string => {
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/wrong-password': 'Invalid login credentials.',
    '23505': 'A record with this information already exists.',
    '22P02': 'Invalid input format.',
    '23503': 'Related record not found.',
    '23514': 'Input does not meet requirements.',
  };
  
  if (error && typeof error === 'object') {
    if (error.code && errorMap[error.code]) return errorMap[error.code];
    if (error.message && errorMap[error.message]) return errorMap[error.message];
  }
  
  return 'An unexpected error occurred. Please try again.';
};

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'"
  };
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...securityHeaders
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const body = await req.json();
    
    // Enhanced validation
    const errors = [];
    if (!body.firstName || typeof body.firstName !== 'string') {
      errors.push('First name is required');
    }
    if (!body.lastName || typeof body.lastName !== 'string') {
      errors.push('Last name is required');
    }
    if (!body.email || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push('Valid email is required');
    }
    if (!body.schoolDistrict || typeof body.schoolDistrict !== 'string') {
      errors.push('School district is required');
    }
    if (!body.streetAddress || typeof body.streetAddress !== 'string') {
      errors.push('Street address is required');
    }
    if (!body.city || typeof body.city !== 'string') {
      errors.push('City is required');
    }
    if (!body.state || typeof body.state !== 'string') {
      errors.push('State is required');
    }
    if (!body.zipCode || typeof body.zipCode !== 'string') {
      errors.push('ZIP code is required');
    }
    if (!body.phone || typeof body.phone !== 'string') {
      errors.push('Phone number is required');
    }
    if (!body.totalAttendees || typeof body.totalAttendees !== 'number' || body.totalAttendees < 1) {
      errors.push('Total attendees must be at least 1');
    }
    
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ success: false, error: errors.join(', ') }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert main registration
    const { data: registration, error: regError } = await supabaseAdmin
      .from('tech_conference_registrations')
      .insert([{
        school_district: body.schoolDistrict,
        first_name: body.firstName,
        last_name: body.lastName,
        street_address: body.streetAddress,
        city: body.city,
        state: body.state,
        zip_code: body.zipCode,
        email: body.email,
        phone: body.phone,
        total_attendees: body.totalAttendees,
        total_amount: body.totalAmount
      }])
      .select()
      .single();

    if (regError) throw regError;

    // Insert additional attendees if any
    if (body.additionalAttendees && body.additionalAttendees.length > 0) {
      const attendeesToInsert = body.additionalAttendees.map((attendee: any) => ({
        registration_id: registration.id,
        first_name: attendee.firstName,
        last_name: attendee.lastName,
        email: attendee.email
      }));

      const { error: attendeesError } = await supabaseAdmin
        .from('tech_conference_attendees')
        .insert(attendeesToInsert);

      if (attendeesError) throw attendeesError;
    }

    return new Response(
      JSON.stringify({ success: true, registrationId: registration.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing registration:', error);
    return new Response(
      JSON.stringify({ success: false, error: sanitizeError(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});