-- Ensure admins can SELECT across all admin-managed tables.
-- This is required for admin UI (and also for INSERT ... RETURNING representation).

-- trips
DROP POLICY IF EXISTS "Admins can view all trips" ON public.trips;
CREATE POLICY "Admins can view all trips"
ON public.trips
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- groups
DROP POLICY IF EXISTS "Admins can view all groups" ON public.groups;
CREATE POLICY "Admins can view all groups"
ON public.groups
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- profiles (PII) - admin-only
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;
CREATE POLICY "Admins can view all user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
