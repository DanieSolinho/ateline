-- =====================================================================
-- Ateline · Etapa 3: pedidos
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Precisa dos arquivos 01 e 02 já rodados. Pode rodar de novo sem problema.
-- =====================================================================

-- Numeração dos pedidos: ATL-1001, ATL-1002...
create sequence if not exists public.pedidos_numero_seq start 1001;

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default ('ATL-' || nextval('public.pedidos_numero_seq')),
  cliente_id uuid references auth.users (id) on delete set null, -- null = pedido sem login
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento', 'pago', 'cancelado', 'concluido')),
  criado_em timestamptz not null default now(),
  guardado_ate timestamptz, -- até quando as peças ficam guardadas esperando o pagamento
  cliente jsonb not null, -- nome, CPF, WhatsApp, e-mail, entrega...
  itens jsonb not null, -- os itens do carrinho, como o site manda
  pago_agora numeric(10, 2) not null,
  na_retirada numeric(10, 2) not null,
  restante_compra numeric(10, 2) not null
);

comment on table public.pedidos is
  'Pedidos do site. Para confirmar um pagamento, mude o status para "pago". Para cancelar, "cancelado" (as peças voltam a ficar livres).';

-- As reservas agora podem vir de um pedido do site, e ficam "guardadas" até o pagamento
alter table public.reservas add column if not exists pedido_id uuid references public.pedidos (id) on delete cascade;
alter table public.reservas add column if not exists guardada_ate timestamptz;

-- A agenda pública passa a esconder as reservas que venceram sem pagamento
drop policy if exists "Agenda pública" on public.reservas;
create policy "Agenda pública" on public.reservas
  for select
  to anon, authenticated
  using (guardada_ate is null or guardada_ate > now());

-- ---------------------------------------------------------------------
-- Reserva as peças de um pedido: o bolo, o topo e a base dourada de cada aluguel.
-- Se alguma peça já estiver ocupada no período, nada é salvo e aparece o erro.
-- ---------------------------------------------------------------------
create or replace function public.reservar_itens(id_do_pedido uuid, itens jsonb, guardar_ate timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  codigo text;
begin
  for item in select value from jsonb_array_elements(itens) loop
    continue when item ->> 'tipo' <> 'aluguel';

    foreach codigo in array array_remove(
      array[item ->> 'codigoBolo', item -> 'topo' ->> 'codigo', item -> 'base' ->> 'codigo'], null
    ) loop
      begin
        insert into public.reservas (codigo, festa, origem, pedido_id, guardada_ate)
        values (codigo, (item ->> 'festa')::date, 'site', id_do_pedido, guardar_ate);
      exception when exclusion_violation then
        raise exception 'PECA_RESERVADA:%', codigo
          using hint = 'Essa peça já está reservada nesse período por outro pedido.';
      end;
    end loop;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- O site chama esta função no checkout (supabase.rpc("criar_pedido")).
-- Ela confere o pedido, salva e reserva as peças, tudo de uma vez.
-- ---------------------------------------------------------------------
create or replace function public.criar_pedido(pedido jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  novo public.pedidos;
  prazo timestamptz := now() + interval '2 hours'; -- tempo para pagar o sinal
  tem_aluguel boolean;
begin
  -- Conferências básicas
  if jsonb_typeof(pedido -> 'itens') is distinct from 'array' or jsonb_array_length(pedido -> 'itens') = 0 then
    raise exception 'PEDIDO_VAZIO';
  end if;
  if jsonb_array_length(pedido -> 'itens') > 10 then
    raise exception 'PEDIDO_GRANDE';
  end if;
  if coalesce(pedido -> 'cliente' ->> 'email', '') = '' or coalesce(pedido -> 'cliente' ->> 'nome', '') = '' then
    raise exception 'DADOS_INCOMPLETOS';
  end if;
  if exists (
    select 1 from jsonb_array_elements(pedido -> 'itens') as i
    where i.value ->> 'tipo' = 'aluguel' and (i.value ->> 'festa')::date <= current_date
  ) then
    raise exception 'DATA_INVALIDA';
  end if;

  tem_aluguel := exists (
    select 1 from jsonb_array_elements(pedido -> 'itens') as i where i.value ->> 'tipo' = 'aluguel'
  );

  -- Solta as reservas que venceram sem pagamento, antes de conferir a agenda
  delete from public.reservas where guardada_ate is not null and guardada_ate < now();

  insert into public.pedidos (cliente_id, guardado_ate, cliente, itens, pago_agora, na_retirada, restante_compra)
  values (
    auth.uid(),
    case when tem_aluguel then prazo end,
    pedido -> 'cliente',
    pedido -> 'itens',
    (pedido ->> 'pagoAgora')::numeric,
    (pedido ->> 'naRetirada')::numeric,
    (pedido ->> 'restanteCompra')::numeric
  )
  returning * into novo;

  perform public.reservar_itens(novo.id, novo.itens, prazo);

  return jsonb_build_object('numero', novo.numero, 'guardadoAte', novo.guardado_ate);
end;
$$;

-- ---------------------------------------------------------------------
-- Quando a dona muda o status no painel do Supabase:
--   pago      → as reservas ficam definitivas (se tinham vencido, o banco tenta reservar de novo)
--   cancelado → as peças voltam a ficar livres
-- ---------------------------------------------------------------------
create or replace function public.ao_mudar_status_do_pedido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pago' and old.status is distinct from 'pago' then
    delete from public.reservas where pedido_id = new.id;
    perform public.reservar_itens(new.id, new.itens, null);
    new.guardado_ate := null;
  elsif new.status = 'cancelado' then
    delete from public.reservas where pedido_id = new.id;
    new.guardado_ate := null;
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_status on public.pedidos;
create trigger pedidos_status
  before update of status on public.pedidos
  for each row execute function public.ao_mudar_status_do_pedido();

-- ---------------------------------------------------------------------
-- Segurança (RLS)
-- Pelo site: a cliente logada só VÊ os próprios pedidos. Criar pedido, só pela função.
-- ---------------------------------------------------------------------
alter table public.pedidos enable row level security;

drop policy if exists "Cliente vê os próprios pedidos" on public.pedidos;
create policy "Cliente vê os próprios pedidos" on public.pedidos
  for select to authenticated
  using ((select auth.uid()) = cliente_id);

revoke all on public.pedidos from anon, authenticated;
grant select on public.pedidos to authenticated;

-- Funções: só a criar_pedido pode ser chamada pelo site
revoke execute on function public.reservar_itens(uuid, jsonb, timestamptz) from public, anon, authenticated;
revoke execute on function public.ao_mudar_status_do_pedido() from public, anon, authenticated;
revoke execute on function public.criar_pedido(jsonb) from public;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;
