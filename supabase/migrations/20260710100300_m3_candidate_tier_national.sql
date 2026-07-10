-- M3: extend candidate_tier with national (for national-tier aspirants)

ALTER TYPE public.candidate_tier ADD VALUE IF NOT EXISTS 'national';
