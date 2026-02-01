-- 管理員可以管理旅程
CREATE POLICY "Admins can insert trips"
ON public.trips
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trips"
ON public.trips
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trips"
ON public.trips
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 管理員可以管理小組
CREATE POLICY "Admins can insert groups"
ON public.groups
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update groups"
ON public.groups
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete groups"
ON public.groups
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 管理員可以管理用戶角色
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user_roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user_roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 管理員可以更新所有用戶的個人資料（用於分配小組）
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));