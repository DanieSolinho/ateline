-- =====================================================================
-- Ateline · Adiamento pelo site e crédito em loja
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Precisa dos arquivos 01 a 07 já rodados. Pode rodar de novo sem problema.
--
-- Regras (do contrato):
--   - Adiamento: só com o sinal pago e com pelo menos 15 dias até a festa, se o bolo estiver livre na nova data.
--   - Cancelamento com o sinal pago: o sinal não volta em dinheiro, vira crédito em loja por 3 meses.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Créditos da cliente. "restante" diminui quando ela usa o crédito num pedido.
-- ---------------------------------------------------------------------
create table if not exists public.creditos (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references auth.users (id) on delete cascade,
  valor numeric(10, 2) not null check (valor > 0),
  restante numeric(10, 2) not null check (restante >= 0),
  valido_ate timestamptz not null,
  pedido_origem uuid references public.pedidos (id) on delete set null,
  criado_em timestamptz not null default now()
);

-- Onde cada crédito foi usado (para devolver se o pedido não for pago)
create table if not exists public.usos_credito (
  id bigint generated always as identity primary key,
  credito_id bigint not null references public.creditos (id) on delete cascade,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  valor numeric(10, 2) not null check (valor > 0),
  criado_em timestamptz not null default now()
);

alter table public.pedidos add column if not exists credito_usado numeric(10, 2) not null default 0;

-- Histórico das mudanças feitas pela cliente (adiamentos, cancelamentos), para a loja consultar
create table if not exists public.historico_pedidos (
  id bigint generated always as identity primary key,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  tipo text not null,
  detalhe jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

-- Segurança: a cliente vê os próprios créditos; o resto, só pelas funções
alter table public.creditos enable row level security;
alter table public.usos_credito enable row level security;
alter table public.historico_pedidos enable row level security;
drop policy if exists "Cliente vê os próprios créditos" on public.creditos;
create policy "Cliente vê os próprios créditos" on public.creditos
  for select to authenticated using ((select auth.uid()) = cliente_id);
revoke all on public.creditos from anon, authenticated;
grant select on public.creditos to authenticated;
revoke all on public.usos_credito from anon, authenticated;
revoke all on public.historico_pedidos from anon, authenticated;

-- ---------------------------------------------------------------------
-- Status do pedido (versão da etapa 6), agora cuidando do crédito:
--   pago → cancelado: o sinal (incluindo o que foi pago com crédito) vira crédito por 3 meses
--   aguardando → cancelado (ou prazo vencido): o crédito usado volta para a cliente
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
    delete from public.vendas where pedido_id = new.id;
    perform public.reservar_itens(new.id, new.itens, null);
    new.guardado_ate := null;

  elsif new.status = 'cancelado' and old.status is distinct from 'cancelado' then
    delete from public.reservas where pedido_id = new.id;
    delete from public.vendas where pedido_id = new.id;
    new.guardado_ate := null;

    if old.status = 'pago' and new.cliente_id is not null and new.pago_agora + new.credito_usado > 0 then
      insert into public.creditos (cliente_id, valor, restante, valido_ate, pedido_origem)
      values (new.cliente_id, new.pago_agora + new.credito_usado, new.pago_agora + new.credito_usado,
              now() + interval '3 months', new.id);
    elsif old.status = 'aguardando_pagamento' then
      update public.creditos c set restante = c.restante + u.valor
      from public.usos_credito u
      where u.pedido_id = new.id and u.credito_id = c.id;
      delete from public.usos_credito where pedido_id = new.id;
    end if;
  end if;
  return new;
end;
$$;

-- Pedidos que passaram do prazo sem pagar viram "cancelado" (e devolvem o crédito usado)
create or replace function public.expirar_pedidos_vencidos()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.pedidos set status = 'cancelado'
  where status = 'aguardando_pagamento' and guardado_ate is not null and guardado_ate < now();
$$;

-- ---------------------------------------------------------------------
-- Saldo de crédito da cliente logada
-- ---------------------------------------------------------------------
create or replace function public.meu_credito()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('saldo', 0, 'venceEm', null);
  end if;
  perform public.expirar_pedidos_vencidos();
  return (
    select jsonb_build_object('saldo', coalesce(sum(restante), 0), 'venceEm', min(valido_ate))
    from public.creditos
    where cliente_id = auth.uid() and restante > 0 and valido_ate > now()
  );
end;
$$;

-- ---------------------------------------------------------------------
-- criar_pedido (versão da etapa 6), agora podendo usar o crédito para pagar o sinal
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
  valores jsonb;
  credito record;
  falta numeric;
  parte numeric;
  usado numeric := 0;
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

  -- Os valores de verdade saem do banco, não do navegador
  valores := public.calcular_valores(pedido -> 'itens');
  if abs((valores ->> 'pagoAgora')::numeric - coalesce((pedido ->> 'pagoAgora')::numeric, -1)) > 0.01
     or abs((valores ->> 'naRetirada')::numeric - coalesce((pedido ->> 'naRetirada')::numeric, -1)) > 0.01
     or abs((valores ->> 'restanteCompra')::numeric - coalesce((pedido ->> 'restanteCompra')::numeric, -1)) > 0.01
  then
    raise exception 'PRECO_DESATUALIZADO';
  end if;

  -- Solta o que venceu sem pagamento, antes de conferir a agenda e o crédito
  perform public.expirar_pedidos_vencidos();
  delete from public.reservas where guardada_ate is not null and guardada_ate < now();
  delete from public.vendas where guardada_ate is not null and guardada_ate < now();

  insert into public.pedidos (cliente_id, guardado_ate, cliente, itens, pago_agora, na_retirada, restante_compra)
  values (
    auth.uid(),
    prazo, -- aluguel e compra: as peças ficam guardadas até o sinal ser pago
    pedido -> 'cliente',
    pedido -> 'itens',
    (valores ->> 'pagoAgora')::numeric,
    (valores ->> 'naRetirada')::numeric,
    (valores ->> 'restanteCompra')::numeric
  )
  returning * into novo;

  perform public.reservar_itens(novo.id, novo.itens, prazo);

  -- Crédito em loja: só para quem está logada e pediu para usar. Gasta primeiro o que vence antes.
  if coalesce((pedido ->> 'usarCredito')::boolean, false) and auth.uid() is not null then
    falta := novo.pago_agora;
    for credito in
      select id, restante from public.creditos
      where cliente_id = auth.uid() and restante > 0 and valido_ate > now()
      order by valido_ate
      for update
    loop
      exit when falta <= 0;
      parte := least(credito.restante, falta);
      update public.creditos set restante = restante - parte where id = credito.id;
      insert into public.usos_credito (credito_id, pedido_id, valor) values (credito.id, novo.id, parte);
      falta := falta - parte;
      usado := usado + parte;
    end loop;

    if usado > 0 then
      update public.pedidos set pago_agora = pago_agora - usado, credito_usado = usado
      where id = novo.id returning * into novo;
    end if;
    -- O crédito pagou o sinal inteiro: o pedido já sai confirmado (e as reservas ficam definitivas)
    if novo.pago_agora = 0 then
      update public.pedidos set status = 'pago' where id = novo.id returning * into novo;
    end if;
  end if;

  return jsonb_build_object(
    'numero', novo.numero,
    'guardadoAte', novo.guardado_ate,
    'pagoAgora', novo.pago_agora,
    'creditoUsado', novo.credito_usado,
    'status', novo.status
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Adiamento: a cliente muda a data de um aluguel do próprio pedido
-- ---------------------------------------------------------------------
create or replace function public.adiar_reserva(numero_do_pedido text, indice_do_item int, nova_festa date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.pedidos;
  item jsonb;
  festa_atual date;
  peca text;
begin
  select * into p from public.pedidos where numero = numero_do_pedido for update;
  if p.id is null or p.cliente_id is distinct from auth.uid() then
    raise exception 'PEDIDO_NAO_ENCONTRADO';
  end if;
  if p.status <> 'pago' then
    raise exception 'ADIAMENTO_SO_PAGO';
  end if;

  item := p.itens -> indice_do_item;
  if item is null or item ->> 'tipo' <> 'aluguel' then
    raise exception 'ITEM_INVALIDO';
  end if;
  festa_atual := (item ->> 'festa')::date;
  if festa_atual - current_date < 15 then
    raise exception 'PRAZO_ADIAMENTO';
  end if;
  if public.data_de_retirada(nova_festa) <= current_date or nova_festa = festa_atual then
    raise exception 'DATA_INVALIDA';
  end if;

  -- Peça vendida não pode ir para outra data
  foreach peca in array array_remove(
    array[item ->> 'codigoBolo', item -> 'topo' ->> 'codigo', item -> 'base' ->> 'codigo'], null
  ) loop
    perform pg_advisory_xact_lock(hashtext(peca));
    if exists (
      select 1 from public.vendas v
      where v.codigo = peca and (v.guardada_ate is null or v.guardada_ate > now())
    ) then
      raise exception 'PECA_RESERVADA:%', peca;
    end if;
  end loop;

  -- Move as peças desse aluguel. A trava da agenda recusa se a nova data já estiver ocupada.
  begin
    update public.reservas set festa = nova_festa
    where pedido_id = p.id and festa = festa_atual
      and codigo in (item ->> 'codigoBolo', item -> 'topo' ->> 'codigo', item -> 'base' ->> 'codigo');
  exception when exclusion_violation then
    raise exception 'PECA_RESERVADA:%', item ->> 'codigoBolo';
  end;

  update public.pedidos
  set itens = jsonb_set(itens, array[indice_do_item::text, 'festa'], to_jsonb(nova_festa::text))
  where id = p.id;

  insert into public.historico_pedidos (pedido_id, tipo, detalhe)
  values (p.id, 'adiamento', jsonb_build_object('item', item ->> 'nome', 'de', festa_atual, 'para', nova_festa));
end;
$$;

-- ---------------------------------------------------------------------
-- Cancelamento pela cliente (só aluguel; compra, pelo WhatsApp)
-- Devolve o valor que virou crédito (0 se o sinal ainda não estava pago)
-- ---------------------------------------------------------------------
create or replace function public.cancelar_meu_pedido(numero_do_pedido text)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.pedidos;
begin
  select * into p from public.pedidos where numero = numero_do_pedido for update;
  if p.id is null or p.cliente_id is distinct from auth.uid() then
    raise exception 'PEDIDO_NAO_ENCONTRADO';
  end if;
  if p.status not in ('aguardando_pagamento', 'pago') then
    raise exception 'NAO_PODE_CANCELAR';
  end if;
  if exists (select 1 from jsonb_array_elements(p.itens) as i where i.value ->> 'tipo' = 'compra') then
    raise exception 'CANCELAR_COMPRA';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p.itens) as i
    where public.data_de_retirada((i.value ->> 'festa')::date) <= current_date
  ) then
    raise exception 'JA_RETIRADO';
  end if;

  update public.pedidos set status = 'cancelado' where id = p.id;
  insert into public.historico_pedidos (pedido_id, tipo, detalhe)
  values (p.id, 'cancelamento', jsonb_build_object('statusAnterior', p.status));

  return case when p.status = 'pago' then p.pago_agora + p.credito_usado else 0 end;
end;
$$;

revoke execute on function public.expirar_pedidos_vencidos() from public, anon, authenticated;
revoke execute on function public.meu_credito() from public, anon;
revoke execute on function public.adiar_reserva(text, int, date) from public, anon;
revoke execute on function public.cancelar_meu_pedido(text) from public, anon;
revoke execute on function public.criar_pedido(jsonb) from public;
grant execute on function public.meu_credito() to authenticated;
grant execute on function public.adiar_reserva(text, int, date) to authenticated;
grant execute on function public.cancelar_meu_pedido(text) to authenticated;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;
