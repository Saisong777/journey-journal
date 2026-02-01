-- 移除 user_roles 表的 user_id 外鍵限制，允許測試資料
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;