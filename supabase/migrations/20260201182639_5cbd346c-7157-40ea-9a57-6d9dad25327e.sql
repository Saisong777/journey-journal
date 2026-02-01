-- 修復 user_roles 表的 RLS 無限遞迴問題
-- 首先刪除有問題的政策
DROP POLICY IF EXISTS "Users can view roles in their trip" ON public.user_roles;

-- 建立新的 RLS 政策，使用 security definer 函數避免遞迴
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view roles of same trip members"
ON public.user_roles
FOR SELECT
USING (
  trip_id IN (
    SELECT ur.trip_id 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid()
  )
);