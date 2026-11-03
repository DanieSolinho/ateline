-- =====================================================================
-- Ateline · Fotos das peças na retirada e na devolução
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Precisa do arquivo 04 já rodado (tabela "equipe"). Pode rodar de novo sem problema.
--
-- As fotos ficam no Storage do Supabase, numa "pasta" (bucket) PRIVADA:
-- só quem está na tabela da equipe envia, vê ou apaga. Clientes e visitantes não têm acesso.
-- =====================================================================

-- A pasta: privada, só JPEG, no máximo 3 MB por foto (o painel já reduz a foto antes de enviar)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-pecas', 'fotos-pecas', false, 3145728, array['image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg'];

drop policy if exists "Equipe vê as fotos das peças" on storage.objects;
create policy "Equipe vê as fotos das peças" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos-pecas' and (select public.e_da_equipe()));

drop policy if exists "Equipe envia fotos das peças" on storage.objects;
create policy "Equipe envia fotos das peças" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-pecas' and (select public.e_da_equipe()));

drop policy if exists "Equipe apaga fotos das peças" on storage.objects;
create policy "Equipe apaga fotos das peças" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos-pecas' and (select public.e_da_equipe()));
