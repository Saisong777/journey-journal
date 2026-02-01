-- 刪除有遞迴問題的政策
DROP POLICY IF EXISTS "Users can view roles of same trip members" ON public.user_roles;

-- 建立 security definer 函數來獲取用戶的 trip_id
CREATE OR REPLACE FUNCTION public.get_user_trip_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT trip_id FROM public.user_roles WHERE user_id = _user_id
$$;

-- 使用函數建立新的 RLS 政策
CREATE POLICY "Users can view roles of same trip"
ON public.user_roles
FOR SELECT
USING (trip_id IN (SELECT public.get_user_trip_ids(auth.uid())));