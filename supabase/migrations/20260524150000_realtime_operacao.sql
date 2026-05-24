-- Realtime para viagens, eventos e ocorrências (ERP + motorista → PC ao vivo)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'viagens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.viagens;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'viagem_eventos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.viagem_eventos;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'viagem_ocorrencias'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.viagem_ocorrencias;
  END IF;
END $$;
