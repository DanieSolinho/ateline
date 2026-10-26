-- =====================================================================
-- Ateline · Etapa 5: painel da loja
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Precisa dos arquivos 01, 02 e 03 já rodados. Pode rodar de novo sem problema.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Equipe: quem pode abrir o painel. Uma linha por pessoa (o mesmo id do login).
-- Para colocar alguém, rode no SQL Editor (trocando o e-mail):
--   insert into public.equipe (id) select id from auth.users where email = 'dona@exemplo.com';
-- A pessoa precisa ter entrado no site pelo menos uma vez antes.
-- ---------------------------------------------------------------------
create table if not exists public.equipe (
  id uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.equipe enable row level security;
revoke all on public.equipe from anon, authenticated; -- ninguém lê a lista pelo site

-- Quem está logada é da equipe?
create or replace function public.e_da_equipe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.equipe where id = auth.uid());
$$;

-- Controle de retirada e devolução de cada peça
alter table public.reservas add column if not exists retirado_em timestamptz;
alter table public.reservas add column if not exists devolvido_em timestamptz;
alter table public.reservas add column if not exists taxa_devolvida numeric(10, 2);

-- A equipe vê todos os pedidos (a cliente continua vendo só os dela)
drop policy if exists "Equipe vê todos os pedidos" on public.pedidos;
create policy "Equipe vê todos os pedidos" on public.pedidos
  for select to authenticated
  using ((select public.e_da_equipe()));

-- ---------------------------------------------------------------------
-- Agenda de um dia: o que sai, o que volta e o que está atrasado,
-- com os dados do pedido (nome, WhatsApp, chave Pix) quando veio do site.
-- ---------------------------------------------------------------------
create or replace function public.agenda_do_dia(dia date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.e_da_equipe() then
    raise exception 'SO_EQUIPE';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'codigo', r.codigo,
        'festa', r.festa,
        'retirada', r.retirada,
        'devolucao', r.devolucao,
        'origem', r.origem,
        'retiradoEm', r.retirado_em,
        'devolvidoEm', r.devolvido_em,
        'taxaDevolvida', r.taxa_devolvida,
        'pedido', case when p.id is null then null else jsonb_build_object(
          'id', p.id,
          'numero', p.numero,
          'status', p.status,
          'nome', p.cliente ->> 'nome',
          'whatsapp', p.cliente ->> 'whatsapp',
          'chavePix', p.cliente ->> 'chavePix',
          'itens', p.itens
        ) end
      )
      order by r.retirada, r.codigo
    )
    from public.reservas r
    left join public.pedidos p on p.id = r.pedido_id
    where (r.guardada_ate is null or r.guardada_ate > now())
      and (
        r.retirada = dia
        or r.devolucao = dia
        -- atrasadas: já saíram, já deviam ter voltado e ainda não voltaram
        or (r.devolucao < dia and r.retirado_em is not null and r.devolvido_em is null)
      )
  ), '[]'::jsonb);
end;
$$;

-- ---------------------------------------------------------------------
-- Ações do painel
-- ---------------------------------------------------------------------
create or replace function public.mudar_status_do_pedido(numero_do_pedido text, novo_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.e_da_equipe() then
    raise exception 'SO_EQUIPE';
  end if;
  if novo_status not in ('pago', 'cancelado', 'concluido') then
    raise exception 'STATUS_INVALIDO';
  end if;
  -- o gatilho da etapa 3 cuida das reservas (fixar ao pagar, soltar ao cancelar)
  update public.pedidos set status = novo_status where numero = numero_do_pedido;
  if not found then
    raise exception 'PEDIDO_NAO_ENCONTRADO';
  end if;
end;
$$;

create or replace function public.registrar_retirada(ids bigint[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.e_da_equipe() then
    raise exception 'SO_EQUIPE';
  end if;
  update public.reservas set retirado_em = now() where id = any (ids) and retirado_em is null;
end;
$$;

create or replace function public.registrar_devolucao(ids bigint[], valor_devolvido numeric)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.e_da_equipe() then
    raise exception 'SO_EQUIPE';
  end if;
  if valor_devolvido < 0 then
    raise exception 'VALOR_INVALIDO';
  end if;
  update public.reservas
  set devolvido_em = now(),
      retirado_em = coalesce(retirado_em, now()), -- se esqueceram de registrar a retirada
      taxa_devolvida = valor_devolvido
  where id = any (ids) and devolvido_em is null;
end;
$$;

-- Só quem está logada pode chamar; cada função confere se é da equipe
revoke execute on function public.e_da_equipe() from public, anon;
revoke execute on function public.agenda_do_dia(date) from public, anon;
revoke execute on function public.mudar_status_do_pedido(text, text) from public, anon;
revoke execute on function public.registrar_retirada(bigint[]) from public, anon;
revoke execute on function public.registrar_devolucao(bigint[], numeric) from public, anon;
grant execute on function public.e_da_equipe() to authenticated;
grant execute on function public.agenda_do_dia(date) to authenticated;
grant execute on function public.mudar_status_do_pedido(text, text) to authenticated;
grant execute on function public.registrar_retirada(bigint[]) to authenticated;
grant execute on function public.registrar_devolucao(bigint[], numeric) to authenticated;
