-- =====================================================================
-- Ateline · Etapa 1: agenda de reservas
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Pode rodar de novo sem problema: ele não apaga reservas já cadastradas.
-- =====================================================================

-- Extensão que deixa o banco comparar "mesmo código + datas que se cruzam"
create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------
-- Regras de datas (as mesmas do site, em lib/periodo.ts)
-- A loja fecha domingo (0) e segunda (1).
-- Retirada: último dia aberto antes da festa. Devolução: primeiro dia aberto depois.
-- ---------------------------------------------------------------------
create or replace function public.data_de_retirada(festa date)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  dia date := festa - 1;
begin
  while extract(dow from dia) in (0, 1) loop
    dia := dia - 1;
  end loop;
  return dia;
end;
$$;

create or replace function public.data_de_devolucao(festa date)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  dia date := festa + 1;
begin
  while extract(dow from dia) in (0, 1) loop
    dia := dia + 1;
  end loop;
  return dia;
end;
$$;

-- ---------------------------------------------------------------------
-- Tabela de reservas
-- A dona só preenche "codigo" e "festa". Retirada e devolução são calculadas.
-- ---------------------------------------------------------------------
create table if not exists public.reservas (
  id bigint generated always as identity primary key,
  codigo text not null check (codigo ~ '^[A-Z0-9_]+$'),
  festa date not null,
  retirada date generated always as (public.data_de_retirada(festa)) stored,
  devolucao date generated always as (public.data_de_devolucao(festa)) stored,
  origem text not null default 'whatsapp' check (origem in ('whatsapp', 'site')),
  criado_em timestamptz not null default now(),

  -- A trava: a mesma peça não pode ter dois períodos que se cruzam
  constraint reserva_sem_conflito exclude using gist (
    codigo with =,
    daterange(retirada, devolucao, '[]') with &&
  )
);

comment on table public.reservas is
  'Agenda das peças. Preencha só codigo (ex.: SAFARI_001) e festa. Não guarde dados de clientes aqui: esta tabela é pública.';

-- ---------------------------------------------------------------------
-- Segurança (RLS): qualquer pessoa pode LER a agenda (o site precisa),
-- mas ninguém pelo site pode criar, mudar ou apagar reservas.
-- A dona cadastra pelo painel do Supabase, que tem acesso total.
-- ---------------------------------------------------------------------
alter table public.reservas enable row level security;

drop policy if exists "Agenda pública" on public.reservas;
create policy "Agenda pública" on public.reservas
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete, truncate on public.reservas from anon, authenticated;
grant select on public.reservas to anon, authenticated;

-- ---------------------------------------------------------------------
-- Reservas de exemplo (as mesmas que o site usava antes)
-- ---------------------------------------------------------------------
insert into public.reservas (codigo, festa)
select codigo, festa::date
from (values
  ('SAFARI_001', '2026-10-31'),
  ('TOPO_001', '2026-11-07'),
  ('BASE_DOURADA_001', '2026-11-07')
) as exemplos (codigo, festa)
where not exists (select 1 from public.reservas);
