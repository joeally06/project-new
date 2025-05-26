import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.38.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
    })

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid token')
    }

    // Verify user is admin
    const { data: userData, error: roleError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !userData || userData.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required')
    }

    // Handle different HTTP methods
    if (req.method === 'POST') {
      const body = await req.json()

      // Validate required fields
      const requiredFields = ['name', 'start_date', 'end_date', 'registration_end_date', 'location', 'venue', 'fee', 'payment_instructions']
      for (const field of requiredFields) {
        if (!body[field]) {
          throw new Error(`Missing required field: ${field}`)
        }
      }

      // Validate dates
      const startDate = new Date(body.start_date)
      const endDate = new Date(body.end_date)
      const regEndDate = new Date(body.registration_end_date)

      if (endDate <= startDate) {
        throw new Error('End date must be after start date')
      }

      if (regEndDate > startDate) {
        throw new Error('Registration end date must be before or on start date')
      }

      // Update conference settings
      const { error: upsertError } = await supabaseClient
        .from('conference_settings')
        .upsert({
          id: body.id,
          name: body.name,
          start_date: body.start_date,
          end_date: body.end_date,
          registration_end_date: body.registration_end_date,
          location: body.location,
          venue: body.venue,
          fee: body.fee,
          payment_instructions: body.payment_instructions,
          description: body.description,
          is_active: true,
          updated_at: new Date().toISOString()
        })

      if (upsertError) {
        throw upsertError
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } 
    else if (req.method === 'DELETE') {
      const body = await req.json()
      
      if (body.clear) {
        // Archive current settings
        const { data: currentSettings } = await supabaseClient
          .from('conference_settings')
          .select('*')
          .eq('is_active', true)
          .single()

        if (currentSettings) {
          // Set current settings to inactive
          const { error: updateError } = await supabaseClient
            .from('conference_settings')
            .update({ is_active: false })
            .eq('id', currentSettings.id)

          if (updateError) {
            throw updateError
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    }

    throw new Error(`Unsupported method: ${req.method}`)
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})