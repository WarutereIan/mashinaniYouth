-- M13: Storage buckets (Slice 6)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-photos',
  'candidate-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-docs',
  'candidate-docs',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Public read for candidate photos
CREATE POLICY "Public read candidate photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'candidate-photos');

-- Authenticated users upload to their candidate folder
CREATE POLICY "Candidates upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'candidate-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Candidates update own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'candidate-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin read for private docs
CREATE POLICY "Admins read candidate docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'candidate-docs'
    AND public.is_admin()
  );

CREATE POLICY "Candidates upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'candidate-docs'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
