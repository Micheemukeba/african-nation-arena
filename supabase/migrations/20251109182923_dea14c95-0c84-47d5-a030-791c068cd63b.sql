-- Make representative_id nullable to allow seed data
ALTER TABLE public.teams 
ALTER COLUMN representative_id DROP NOT NULL;