-- REPLICA IDENTITY FULL — necessário para Realtime enviar UPDATE/DELETE com filtros RLS

ALTER TABLE public.viagens REPLICA IDENTITY FULL;
ALTER TABLE public.viagem_eventos REPLICA IDENTITY FULL;
ALTER TABLE public.viagem_ocorrencias REPLICA IDENTITY FULL;
ALTER TABLE public.viagem_localizacoes REPLICA IDENTITY FULL;
