-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can insert trips" ON public.trips;
DROP POLICY IF EXISTS "Admins can update trips" ON public.trips;
DROP POLICY IF EXISTS "Admins can delete trips" ON public.trips;

DROP POLICY IF EXISTS "Admins can insert groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON public.groups;

DROP POLICY IF EXISTS "Admins can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user_roles" ON public.user_roles;

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Recreate as PERMISSIVE policies for trips
CREATE POLICY "Admins can insert trips" 
ON public.trips 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trips" 
ON public.trips 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trips" 
ON public.trips 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Recreate as PERMISSIVE policies for groups
CREATE POLICY "Admins can insert groups" 
ON public.groups 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update groups" 
ON public.groups 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete groups" 
ON public.groups 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Recreate as PERMISSIVE policies for user_roles
CREATE POLICY "Admins can insert user_roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user_roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user_roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Recreate as PERMISSIVE policy for profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));