import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'No token provided' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }
    
    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (!secretKey) {
      console.error('TURNSTILE_SECRET_KEY not found in environment')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Verify with Cloudflare Turnstile
    const formData = new FormData()
    formData.append('secret', secretKey)
    formData.append('response', token)

    console.log('Verifying Turnstile token with Cloudflare...')
    
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const outcome = await result.json()
    
    console.log('Turnstile verification result:', outcome)

    // Return the verification result
    return new Response(
      JSON.stringify(outcome),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in verify-turnstile function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})