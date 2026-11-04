-- =====================================================================
-- Ateline · Posts do Instagram: rascunho → aprovação → agendado → publicado
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Precisa do arquivo 04 já rodado (tabela "equipe"). Pode rodar de novo sem problema.
--
-- Só a equipe vê e mexe nos posts. A imagem não fica guardada: o painel
-- monta a imagem de novo a partir de "dados" sempre que precisa.
-- =====================================================================

create table if not exists public.posts_instagram (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('livres', 'destaque', 'como-funciona', 'livre')),
  titulo text not null check (char_length(titulo) between 1 and 80),
  legenda text not null check (char_length(legenda) <= 2200), -- limite do Instagram
  dados jsonb not null default '{}'::jsonb,                   -- o que a imagem mostra (bolos, data…)
  status text not null default 'rascunho'
    check (status in ('rascunho', 'agendado', 'publicado', 'descartado')),
  agendado_para timestamptz,
  criado_por text,
  aprovado_por text,
  criado_em timestamptz not null default now(),
  aprovado_em timestamptz,
  publicado_em timestamptz,
  check (status <> 'agendado' or agendado_para is not null)
);

create index if not exists posts_instagram_status on public.posts_instagram (status, agendado_para);

alter table public.posts_instagram enable row level security;

drop policy if exists "Equipe vê os posts" on public.posts_instagram;
create policy "Equipe vê os posts" on public.posts_instagram
  for select to authenticated using ((select public.e_da_equipe()));

drop policy if exists "Equipe cria posts" on public.posts_instagram;
create policy "Equipe cria posts" on public.posts_instagram
  for insert to authenticated with check ((select public.e_da_equipe()));

drop policy if exists "Equipe altera posts" on public.posts_instagram;
create policy "Equipe altera posts" on public.posts_instagram
  for update to authenticated using ((select public.e_da_equipe())) with check ((select public.e_da_equipe()));

revoke all on public.posts_instagram from anon, authenticated;
grant select, insert, update on public.posts_instagram to authenticated;

-- Quem criou e quem aprovou ficam registrados pelo próprio banco (não dá para "fingir" pelo navegador)
create or replace function public.ao_salvar_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  quem text := (select email from auth.users where id = auth.uid());
begin
  if tg_op = 'INSERT' then
    new.criado_por := quem;
    new.status := 'rascunho';
    new.aprovado_por := null;
    new.aprovado_em := null;
    new.publicado_em := null;
  else
    if new.status = 'agendado' and old.status is distinct from 'agendado' then
      new.aprovado_por := quem;
      new.aprovado_em := now();
    end if;
    if new.status = 'rascunho' then
      new.aprovado_por := null;
      new.aprovado_em := null;
    end if;
    if new.status = 'publicado' and old.status is distinct from 'publicado' then
      new.publicado_em := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists posts_instagram_ao_salvar on public.posts_instagram;
create trigger posts_instagram_ao_salvar
  before insert or update on public.posts_instagram
  for each row execute function public.ao_salvar_post();
