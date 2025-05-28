import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const allowedOrigins = [
  'https://tapt.org',
  'https://admin.tapt.org',
  'http://localhost:5173'
];

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'"
};

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  ...securityHeaders
};

interface MembershipApplication {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  organization: string;
  position: string;
  membership_type: string;
  is_new_member: string;
  hear_about_us: string | null;
  interests: string[];
  agree_to_terms: boolean;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  corsHeaders['Access-Control-Allow-Origin'] = allowedOrigins.includes(origin) ? origin : '';

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

    const payload: MembershipApplication = await req.json();

    // Validate required fields
    const requiredFields = [
      'first_name',
      'last_name', 
      'email',
      'phone',
      'organization',
      'position',
      'membership_type',
      'is_new_member',
      'interests',
      'agree_to_terms'
    ];

    for (const field of requiredFields) {
      if (!payload[field as keyof MembershipApplication]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone format
    const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
    if (!phoneRegex.test(payload.phone.replace(/\s/g, ''))) {
      throw new Error('Invalid phone number format');
    }

    // Validate membership type
    const validTypes = ['individual', 'district', 'vendor'];
    if (!validTypes.includes(payload.membership_type)) {
      throw new Error('Invalid membership type');
    }

    // Validate interests array
    if (!Array.isArray(payload.interests) || payload.interests.length === 0) {
      throw new Error('At least one interest must be selected');
    }

    // Validate terms agreement
    if (!payload.agree_to_terms) {
      throw new Error('Must agree to terms and conditions');
    }

    // Check for rate limiting
    const rateLimitKey = `membership_${payload.email}`;
    const { data: rateLimit } = await supabaseAdmin
      .from('rate_limits')
      .select('count, last_attempt')
      .eq('key', rateLimitKey)
      .single();

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (rateLimit) {
      if (new Date(rateLimit.last_attempt) > hourAgo && rateLimit.count >= 3) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      await supabaseAdmin
        .from('rate_limits')
        .upsert({
          key: rateLimitKey,
          count: new Date(rateLimit.last_attempt) > hourAgo ? rateLimit.count + 1 : 1,
          last_attempt: now.toISOString()
        });
    } else {
      await supabaseAdmin
        .from('rate_limits')
        .insert({
          key: rateLimitKey,
          count: 1,
          last_attempt: now.toISOString()
        });
    }

    // Check for duplicate applications
    const { count: existingCount, error: duplicateError } = await supabaseAdmin
      .from('membership_applications')
      .select('*', { count: 'exact', head: true })
      .eq('email', payload.email)
      .eq('status', 'pending');

    if (duplicateError) {
      throw new Error('Failed to check for duplicate applications');
    }

    if (existingCount && existingCount > 0) {
      throw new Error('You already have a pending membership application');
    }

    // Insert application
    const { data, error } = await supabaseAdmin
      .from('membership_applications')
      .insert([{
        ...payload,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true,
        data
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: sanitizeError(error),
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});