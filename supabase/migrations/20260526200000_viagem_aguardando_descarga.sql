-- Novo status operacional: motorista chegou ao destino e aguarda início da descarga.
-- Coluna viagens.status é text; valor válido: aguardando_descarga

comment on column public.viagens.status is
  'Status operacional. Valores: planejada, aguardando_carregamento, em_carregamento, em_transito, parada, aguardando_descarga, em_descarga, com_ocorrencia, finalizada, cancelada';
