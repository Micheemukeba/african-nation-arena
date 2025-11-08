-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'federation_representative');

-- Create enum for player positions
CREATE TYPE public.player_position AS ENUM ('GK', 'DF', 'MD', 'AT');

-- Create enum for match stages
CREATE TYPE public.match_stage AS ENUM ('quarter_final', 'semi_final', 'final');

-- Create enum for match types
CREATE TYPE public.match_type AS ENUM ('played', 'simulated');

-- Create enum for tournament status
CREATE TYPE public.tournament_status AS ENUM ('registration', 'in_progress', 'completed');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL UNIQUE,
  representative_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  representative_name TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  team_rating DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  natural_position player_position NOT NULL,
  rating_gk INTEGER NOT NULL CHECK (rating_gk >= 0 AND rating_gk <= 100),
  rating_df INTEGER NOT NULL CHECK (rating_df >= 0 AND rating_df <= 100),
  rating_md INTEGER NOT NULL CHECK (rating_md >= 0 AND rating_md <= 100),
  rating_at INTEGER NOT NULL CHECK (rating_at >= 0 AND rating_at <= 100),
  is_captain BOOLEAN DEFAULT FALSE,
  goals_scored INTEGER DEFAULT 0,
  total_minutes_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status tournament_status DEFAULT 'registration',
  current_stage match_stage,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  stage match_stage NOT NULL,
  team1_id UUID NOT NULL REFERENCES public.teams(id),
  team2_id UUID NOT NULL REFERENCES public.teams(id),
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  match_type match_type,
  commentary TEXT,
  winner_id UUID REFERENCES public.teams(id),
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create goal_events table
CREATE TABLE public.goal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id),
  team_id UUID NOT NULL REFERENCES public.teams(id),
  minute INTEGER NOT NULL CHECK (minute >= 0 AND minute <= 120),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.goal_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- RLS Policies for teams
CREATE POLICY "Teams are viewable by everyone"
ON public.teams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teams are viewable by public"
ON public.teams FOR SELECT
TO anon
USING (true);

CREATE POLICY "Representatives can create their own team"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = representative_id);

CREATE POLICY "Representatives can update their own team"
ON public.teams FOR UPDATE
TO authenticated
USING (auth.uid() = representative_id);

CREATE POLICY "Admins can manage all teams"
ON public.teams FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for players
CREATE POLICY "Players are viewable by everyone"
ON public.players FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Players are viewable by public"
ON public.players FOR SELECT
TO anon
USING (true);

CREATE POLICY "Representatives can manage their team's players"
ON public.players FOR ALL
TO authenticated
USING (
  team_id IN (
    SELECT id FROM public.teams WHERE representative_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all players"
ON public.players FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tournaments
CREATE POLICY "Tournaments are viewable by everyone"
ON public.tournaments FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tournaments"
ON public.tournaments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for matches
CREATE POLICY "Matches are viewable by everyone"
ON public.matches FOR SELECT
USING (true);

CREATE POLICY "Admins can manage matches"
ON public.matches FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for goal_events
CREATE POLICY "Goal events are viewable by everyone"
ON public.goal_events FOR SELECT
USING (true);

CREATE POLICY "Admins can manage goal events"
ON public.goal_events FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update team rating when players change
CREATE OR REPLACE FUNCTION public.update_team_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  avg_rating DECIMAL(5,2);
BEGIN
  SELECT AVG(
    (rating_gk + rating_df + rating_md + rating_at) / 4.0
  ) INTO avg_rating
  FROM public.players
  WHERE team_id = COALESCE(NEW.team_id, OLD.team_id);
  
  UPDATE public.teams
  SET team_rating = COALESCE(avg_rating, 0),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.team_id, OLD.team_id);
  
  RETURN NEW;
END;
$$;

-- Trigger to update team rating
CREATE TRIGGER update_team_rating_on_player_change
  AFTER INSERT OR UPDATE OR DELETE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.update_team_rating();

-- Function to update player statistics after goal
CREATE OR REPLACE FUNCTION public.update_player_stats_on_goal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.players
  SET goals_scored = goals_scored + 1
  WHERE id = NEW.player_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update player stats
CREATE TRIGGER update_player_stats_on_goal
  AFTER INSERT ON public.goal_events
  FOR EACH ROW EXECUTE FUNCTION public.update_player_stats_on_goal();