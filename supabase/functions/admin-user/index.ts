import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const allowedOrigins = [
  'https://tapt.org',
  'https://admin.tapt.org',
  'http://localhost:5173',
  'https://localhost:5173'
];

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'"
};

const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  ...securityHeaders
};

interface CreateUserPayload {
  email: string;
  password: string;
  role: 'user' | 'admin';
}

interface DeleteUserPayload {
  userId: string;
}

// Helper to log admin actions
type AdminLogEntry = {
  action: string;
  user_id: string;
  outcome: 'success' | 'failure';
  error?: string;
  details?: any;
};
async function logAdminAction(supabaseAdmin: any, entry: AdminLogEntry) {
  try {
    await supabaseAdmin.from('admin_logs').insert([
      {
        action: entry.action,
        user_id: entry.user_id,
        outcome: entry.outcome,
        error: entry.error || null,
        details: entry.details ? JSON.stringify(entry.details) : null,
        timestamp: new Date().toISOString(),
      },
    ]);
    // TODO: Integrate alerting/monitoring for repeated failures
  } catch (e) {
    // Logging failure should not block main flow
    console.error("Failed to log admin action:", e);
  }
}

Deno.serve(async (req) => {
  console.log("Admin user function called");
  
  let user: any = undefined;
  let supabaseAdmin: any = undefined;

  const origin = req.headers.get('Origin') || '';
  const responseCorsHeaders = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      status: 204,
      headers: responseCorsHeaders 
    });
  }

  try {
    console.log(`Processing ${req.method} request for admin user`);
    
    // Verify request method
    if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
      throw new Error('Method not allowed');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      throw new Error('Server configuration error: Missing required environment variables');
    }

    // Create authenticated Supabase client using service role key
    supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    user = authUser;

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    if (req.method === 'GET') {
      console.log("Fetching users list");
      
      // Fetch all users
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        throw listError;
      }

      // Get roles from users table
      const { data: rolesData, error: rolesError } = await supabaseAdmin
        .from('users')
        .select('id, role');

      if (rolesError) {
        throw rolesError;
      }

      // Create a map of user roles
      const roleMap = new Map(rolesData.map(user => [user.id, user.role]));

      // Combine the data
      const users = authUsers.users.map(authUser => ({
        id: authUser.id,
        email: authUser.email,
        role: roleMap.get(authUser.id) || 'user',
        created_at: authUser.created_at
      }));

      await logAdminAction(supabaseAdmin, {
        action: 'list_users',
        user_id: user.id,
        outcome: 'success',
      });

      console.log(`Found ${users.length} users`);
      return new Response(
        JSON.stringify({ 
          success: true,
          users
        }),
        { 
          headers: {
            ...responseCorsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (req.method === 'POST') {
      console.log("Creating new user");
      
      // Create new user
      let payload: CreateUserPayload;
      try {
        payload = await req.json();
        console.log("Received payload:", JSON.stringify({
          email: payload.email,
          role: payload.role
          // Omitting password for security
        }));
      } catch (error) {
        console.error("Error parsing request JSON:", error);
        throw new Error('Invalid request format: Unable to parse JSON');
      }

      // Check if user already exists in auth
      const { data: existingUsers } = await supabaseAdmin
        .from('auth.users')
        .select('id')
        .eq('email', payload.email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('A user with this email already exists');
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        throw createError || new Error('Failed to create user');
      }

      // Check if user already exists in users table
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', newUser.user.id)
        .single();

      if (!existingUser) {
        // Only insert if user doesn't exist
        const { error: roleError } = await supabaseAdmin
          .from('users')
          .insert([{
            id: newUser.user.id,
            role: payload.role,
          }]);

        if (roleError) {
          // Cleanup: delete the auth user if role assignment fails
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          throw roleError;
        }
      }

      await logAdminAction(supabaseAdmin, {
        action: 'create_user',
        user_id: user.id,
        outcome: 'success',
        details: { created_user: newUser.user.id, email: payload.email, role: payload.role }
      });

      console.log("User created successfully");
      return new Response(
        JSON.stringify({ 
          success: true, 
          user: {
            id: newUser.user.id,
            email: newUser.user.email,
            role: payload.role,
          }
        }),
        { 
          headers: {
            ...responseCorsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (req.method === 'DELETE') {
      console.log("Deleting user");
      
      // Delete user
      let payload: DeleteUserPayload;
      try {
        payload = await req.json();
        console.log("Received payload:", JSON.stringify(payload));
      } catch (error) {
        console.error("Error parsing request JSON:", error);
        throw new Error('Invalid request format: Unable to parse JSON');
      }

      // First, verify the user exists in auth
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(
        payload.userId
      );

      if (authUserError || !authUser.user) {
        throw new Error('User not found in auth system');
      }

      // Check if user exists and is not the last admin
      const { data: userToDelete, error: userCheckError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', payload.userId)
        .single();

      if (userCheckError) {
        throw new Error(`Failed to check user status: ${userCheckError.message}`);
      }

      if (userToDelete?.role === 'admin') {
        // Count remaining admins
        const { count, error: countError } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');

        if (countError) {
          throw new Error(`Failed to count admins: ${countError.message}`);
        }

        if (count === 1) {
          throw new Error('Cannot delete the last admin user');
        }
      }

      // Delete any conference registrations associated with the user
      const { error: regDeleteError } = await supabaseAdmin
        .from('conference_registrations')
        .delete()
        .eq('id', payload.userId);

      if (regDeleteError) {
        console.error('Error deleting conference registrations:', regDeleteError);
        // Continue with deletion even if this fails
      }

      // Delete the user from the users table first
      const { error: userDeleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', payload.userId);

      if (userDeleteError) {
        throw new Error(`Failed to delete user from users table: ${userDeleteError.message}`);
      }

      // Finally, delete user from auth
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
        payload.userId
      );

      if (deleteAuthError) {
        // If auth deletion fails, we should try to rollback the users table deletion
        try {
          await supabaseAdmin
            .from('users')
            .insert([{ id: payload.userId, role: userToDelete?.role || 'user' }]);
        } catch (rollbackError) {
          console.error('Failed to rollback user deletion:', rollbackError);
        }
        throw new Error(`Failed to delete user from auth: ${deleteAuthError.message}`);
      }

      await logAdminAction(supabaseAdmin, {
        action: 'delete_user',
        user_id: user.id,
        outcome: 'success',
        details: { deleted_user: payload.userId }
      });

      console.log("User deleted successfully");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'User deleted successfully'
        }),
        { 
          headers: {
            ...responseCorsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

  } catch (error) {
    console.error("Error in admin-user function:", error);

    // Try to log the failed action if user and supabaseAdmin are available
    try {
      if (supabaseAdmin && user && user.id) {
        await logAdminAction(supabaseAdmin, {
          action: req.method === 'GET' ? 'list_users' : req.method === 'POST' ? 'create_user' : req.method === 'DELETE' ? 'delete_user' : 'unknown',
          user_id: user.id,
          outcome: 'failure',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      { 
        status: 400,
        headers: {
          ...responseCorsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});