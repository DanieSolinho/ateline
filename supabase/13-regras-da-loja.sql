-- =====================================================================
-- Ateline · Regras da loja (respostas da dona, novembro/2026)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Precisa dos arquivos 01 a 08 já rodados. Pode rodar de novo sem problema.
--
--   - Sinal imediato: as peças ficam guardadas só 30 minutos (o tempo de fazer o Pix), não mais 2 horas.
--   - Cancelamento com sinal pago: por cortesia, o valor fica como crédito por 90 dias (antes: 3 meses).
--   - IP do aceite: o pedido guarda o IP de quem aceitou o contrato, para constar no contrato em PDF.
-- =====================================================================

alter table public.pedidos add column if not exists ip_aceite text;

-- O IP de quem está fazendo o pedido, como o Supabase recebe (null se não vier)
create or replace function public.ip_da_requisicao()
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  cabecalhos jsonb;
begin
  cabecalhos := nullif(current_setting('request.headers', true), '')::jsonb;
  if cabecalhos is null then
    return null;
  end if;
  return left(nullif(trim(coalesce(
    cabecalhos ->> 'cf-connecting-ip',
    cabecalhos ->> 'x-real-ip',
    split_part(cabecalhos ->> 'x-forwarded-for', ',', 1)
  )), ''), 45);
exception when others then
  return null;
end;
$$;

revoke execute on function public.ip_da_requisicao() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Status do pedido (versão do arquivo 08), com o crédito valendo 90 dias
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
              now() + interval '90 days', new.id);
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

-- ---------------------------------------------------------------------
-- criar_pedido (versão do arquivo 08), com 30 minutos para o sinal e o IP do aceite
-- ---------------------------------------------------------------------
create or replace function public.criar_pedido(pedido jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  novo public.pedidos;
  prazo timestamptz := now() + interval '30 minutes'; -- sinal imediato: só o tempo de fazer o Pix
  valores jsonb;
  credito record;
  falta numeric;
  parte numeric;
  usado numeric := 0;
  ip text := public.ip_da_requisicao();
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

  insert into public.pedidos (cliente_id, guardado_ate, cliente, itens, pago_agora, na_retirada, restante_compra, ip_aceite)
  values (
    auth.uid(),
    prazo, -- aluguel e compra: as peças ficam guardadas até o sinal ser pago
    pedido -> 'cliente',
    pedido -> 'itens',
    (valores ->> 'pagoAgora')::numeric,
    (valores ->> 'naRetirada')::numeric,
    (valores ->> 'restanteCompra')::numeric,
    ip
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
    'status', novo.status,
    'ipAceite', novo.ip_aceite
  );
end;
$$;

revoke execute on function public.criar_pedido(jsonb) from public;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;
