import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { sanitizeError } from '../../../src/lib/errors.ts';

const allowedOrigins = [
  'https://tapt.org',
  'https://admin.tapt.org',
  'http://localhost:5173'
];

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'"
  };
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
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
    // Basic validation (expand as needed)
    if (!body.email || !body.first_name || !body.last_name) {
      throw new Error('Missing required fields');
    }

    // Rate limiting and duplicate check can be added here

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
      const { error: attendeesError } = await supabaseAdmin
        .from('tech_conference_attendees')
        .insert(
          body.additionalAttendees.map((attendee: any) => ({
            registration_id: registration.id,
            first_name: attendee.firstName,
            last_name: attendee.lastName,
            email: attendee.email
          }))
        );
      if (attendeesError) throw attendeesError;
    }

    return new Response(
      JSON.stringify({ success: true, registrationId: registration.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: sanitizeError(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
