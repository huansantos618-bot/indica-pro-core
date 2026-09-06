CREATE POLICY "media leitura" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'public-media');
CREATE POLICY "media upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public-media');
CREATE POLICY "media update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'public-media' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'public-media' AND owner = auth.uid());
CREATE POLICY "media delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'public-media' AND owner = auth.uid());