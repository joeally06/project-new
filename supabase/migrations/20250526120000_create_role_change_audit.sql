-- Migration: Create role_change_audit table for audit logging of role changes
CREATE TABLE IF NOT EXISTS public.role_change_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_user_id uuid REFERENCES auth.users(id),
    target_user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    success boolean NOT NULL,
    timestamp timestamptz NOT NULL DEFAULT now(),
    details jsonb
);

-- Index for fast rate limiting queries
CREATE INDEX IF NOT EXISTS idx_role_change_audit_requesting_user_id_timestamp
    ON public.role_change_audit (requesting_user_id, timestamp DESC);

-- RLS: Only service role can insert
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role insert" ON public.role_change_audit
    FOR INSERT TO service_role
    USING (true);

-- [SECURITY] Only Edge Functions (service role) should be able to write to this table.
-- [SECURITY] Monitor and alert on excessive failed attempts or audit log write failures.
