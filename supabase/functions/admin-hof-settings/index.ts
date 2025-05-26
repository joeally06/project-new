// filepath: supabase/functions/admin-hof-settings/index.ts
import express from "npm:express@4.18.2";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const app = express();
app.use(express.json());

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders).send();
  }
  
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

app.post('/', async (req, res) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { id, name, start_date, end_date, description, nomination_instructions, eligibility_criteria, is_active, updated_at } = req.body;
  if (!name || !start_date || !end_date) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const { error } = await supabase
    .from('hall_of_fame_settings')
    .upsert([
      { id, name, start_date, end_date, description, nomination_instructions, eligibility_criteria, is_active, updated_at }
    ]);
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  return res.status(200).json({ success: true });
});

app.delete('/', async (req, res) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { clear } = req.body;
  if (!clear) {
    return res.status(400).json({ message: 'Missing clear flag' });
  }
  const { error } = await supabase
    .from('hall_of_fame_settings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  return res.status(200).json({ success: true });
});

app.all('*', (req, res) => {
  res.status(405).json({ message: 'Method not allowed' });
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create a mock Express request and response
  const mockReq = {
    method: req.method,
    url: new URL(req.url).pathname,
    headers: Object.fromEntries(req.headers.entries()),
    body: req.method !== 'GET' ? await req.json() : undefined,
  };

  let responseBody = '';
  let responseStatus = 200;
  let responseHeaders = {};

  const mockRes = {
    status: (status) => {
      responseStatus = status;
      return mockRes;
    },
    set: (headers) => {
      responseHeaders = { ...responseHeaders, ...headers };
      return mockRes;
    },
    json: (body) => {
      responseBody = JSON.stringify(body);
      responseHeaders['Content-Type'] = 'application/json';
      return mockRes;
    },
    send: (body) => {
      responseBody = body;
      return mockRes;
    }
  };

  // Process the request through Express
  try {
    await new Promise((resolve) => {
      app._router.handle(mockReq, mockRes, resolve);
    });
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Return the response
  return new Response(responseBody, {
    status: responseStatus,
    headers: { ...corsHeaders, ...responseHeaders }
  });
});