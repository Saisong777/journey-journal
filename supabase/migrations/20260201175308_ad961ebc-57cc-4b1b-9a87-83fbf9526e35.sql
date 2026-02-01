-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'leader', 'guide', 'member');

-- Create trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groups/teams table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  dietary_restrictions TEXT,
  medical_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (user_id, trip_id)
);

-- Create journal entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  location TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create journal photos table
CREATE TABLE public.journal_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user locations table for real-time location sharing
CREATE TABLE public.user_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devotional entries table
CREATE TABLE public.devotional_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  scripture_reference TEXT NOT NULL,
  reflection TEXT,
  prayer TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attraction favorites table
CREATE TABLE public.attraction_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  attraction_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, attraction_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotional_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attraction_favorites ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's current trip
CREATE OR REPLACE FUNCTION public.get_user_trip_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT trip_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for trips (everyone in trip can view)
CREATE POLICY "Users can view trips they belong to"
ON public.trips FOR SELECT
TO authenticated
USING (
  id IN (SELECT trip_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- RLS Policies for groups
CREATE POLICY "Users can view groups in their trip"
ON public.groups FOR SELECT
TO authenticated
USING (
  trip_id IN (SELECT trip_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their trip"
ON public.profiles FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT g.id FROM public.groups g
    JOIN public.user_roles ur ON ur.trip_id = g.trip_id
    WHERE ur.user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their trip"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  trip_id IN (SELECT trip_id FROM public.user_roles WHERE user_id = auth.uid())
);

-- RLS Policies for journal_entries
CREATE POLICY "Users can view journal entries in their trip"
ON public.journal_entries FOR SELECT
TO authenticated
USING (
  trip_id IN (SELECT trip_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create their own journal entries"
ON public.journal_entries FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own journal entries"
ON public.journal_entries FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own journal entries"
ON public.journal_entries FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for journal_photos
CREATE POLICY "Users can view photos of visible journal entries"
ON public.journal_photos FOR SELECT
TO authenticated
USING (
  journal_entry_id IN (
    SELECT id FROM public.journal_entries
    WHERE trip_id IN (SELECT trip_id FROM public.user_roles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can add photos to their own journal entries"
ON public.journal_photos FOR INSERT
TO authenticated
WITH CHECK (
  journal_entry_id IN (
    SELECT id FROM public.journal_entries WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own journal photos"
ON public.journal_photos FOR DELETE
TO authenticated
USING (
  journal_entry_id IN (
    SELECT id FROM public.journal_entries WHERE user_id = auth.uid()
  )
);

-- RLS Policies for user_locations
CREATE POLICY "Users can view locations in their trip"
ON public.user_locations FOR SELECT
TO authenticated
USING (
  trip_id IN (SELECT trip_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own location"
ON public.user_locations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own location"
ON public.user_locations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for devotional_entries
CREATE POLICY "Users can view devotional entries in their trip"
ON public.devotional_entries FOR SELECT
TO authenticated
USING (
  trip_id IN (SELECT trip_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create their own devotional entries"
ON public.devotional_entries FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own devotional entries"
ON public.devotional_entries FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for attraction_favorites
CREATE POLICY "Users can view their own favorites"
ON public.attraction_favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites"
ON public.attraction_favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their favorites"
ON public.attraction_favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_devotional_entries_updated_at
  BEFORE UPDATE ON public.devotional_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for location sharing
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Storage policies for photos bucket
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);