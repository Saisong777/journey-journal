-- 移除 profiles 表的 user_id 外鍵限制，允許測試資料
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;