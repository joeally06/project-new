// filepath: supabase/functions/admin-hof-settings/index.ts
import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  // Optionally, verify the JWT here for extra security

  const method = req.method;
  let body: any = {};
  if (method !== 'GET') {
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ message: 'Invalid JSON' }), { status: 400 });
    }
  }

  try {
    if (method === 'POST') {
      // Upsert (add/update) Hall of Fame settings
      const { id, name, start_date, end_date, description, nomination_instructions, eligibility_criteria, is_active, updated_at } = body;
      if (!name || !start_date || !end_date) {
        return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
      }
      const { error } = await supabase
        .from('hall_of_fame_settings')
        .upsert([
          { id, name, start_date, end_date, description, nomination_instructions, eligibility_criteria, is_active, updated_at }
        ]);
      if (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (method === 'DELETE') {
      // Clear all Hall of Fame settings except the default/placeholder
      const { clear } = body;
      if (!clear) {
        return new Response(JSON.stringify({ message: 'Missing clear flag' }), { status: 400 });
      }
      const { error } = await supabase
        .from('hall_of_fame_settings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });
  } catch (err: any) {
    return new Response(JSON.stringify({ message: err.message || 'Internal server error' }), { status: 500 });
  }
});
