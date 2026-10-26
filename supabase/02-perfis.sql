-- =====================================================================
-- Ateline · Etapa 2: dados das clientes (perfis)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Pode rodar de novo sem problema.
-- =====================================================================

-- Uma linha por cliente. O "id" é o mesmo do login (tabela auth.users do Supabase),
-- e o e-mail fica no próprio login, por isso não se repete aqui.
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text check (char_length(nome) <= 120),
  cpf text check (cpf ~ '^[0-9]{11}$'),
  whatsapp text check (whatsapp ~ '^[0-9]{10,11}$'),
  chave_pix text check (char_length(chave_pix) <= 140),
  atualizado_em timestamptz not null default now()
);

comment on table public.perfis is
  'Dados pessoais de cada cliente. Pelo site, cada pessoa só lê e altera a própria linha.';

-- ---------------------------------------------------------------------
-- Segurança (RLS): cada cliente só enxerga e altera a PRÓPRIA linha.
-- auth.uid() é o id de quem está logado. Visitante sem login não vê nada.
-- ---------------------------------------------------------------------
alter table public.perfis enable row level security;

drop policy if exists "Cliente vê o próprio perfil" on public.perfis;
create policy "Cliente vê o próprio perfil" on public.perfis
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Cliente cria o próprio perfil" on public.perfis;
create policy "Cliente cria o próprio perfil" on public.perfis
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Cliente altera o próprio perfil" on public.perfis;
create policy "Cliente altera o próprio perfil" on public.perfis
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke all on public.perfis from anon;
revoke delete, truncate on public.perfis from authenticated;
grant select, insert, update on public.perfis to authenticated;

-- Atualiza a data de alteração sozinho
create or replace function public.marcar_atualizacao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists perfis_atualizado_em on public.perfis;
create trigger perfis_atualizado_em
  before update on public.perfis
  for each row execute function public.marcar_atualizacao();
