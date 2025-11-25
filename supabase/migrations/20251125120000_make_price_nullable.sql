-- Make products.price nullable so products can be created without a price
ALTER TABLE public.products ALTER COLUMN price DROP NOT NULL;

-- Note: If you're running migrations against an existing database, apply this migration in the Supabase migrations workflow or run the ALTER TABLE command manually in your DB.
