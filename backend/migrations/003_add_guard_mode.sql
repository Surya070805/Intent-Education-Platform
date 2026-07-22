-- Migration: Add guard_mode_enabled to learning_profiles

ALTER TABLE public.learning_profiles
ADD COLUMN IF NOT EXISTS guard_mode_enabled BOOLEAN DEFAULT true;
