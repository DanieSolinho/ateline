-- =====================================================================
-- Ateline · Venda tira o bolo do acervo
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Precisa dos arquivos 01 a 05 já rodados. Pode rodar de novo sem problema.
--
-- Como funciona:
--   - Compra no site: a peça fica guardada por 2 horas (ninguém aluga nem compra).
--   - Sinal pago (status "pago" no painel): a venda vira definitiva e a peça sai do site.
--   - Cancelado ou prazo vencido: a peça volta a ficar livre.
-- =====================================================================

create table if not exists public.vendas (
  id bigint generated always as identity primary key,
  codigo text not null,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  guardada_ate timestamptz, -- null = venda confirmada
  criado_em timestamptz not null default now()
);

-- Uma peça só pode ter UMA venda confirmada
create unique index if not exists vendas_uma_por_peca on public.vendas (codigo) where guardada_ate is null;

comment on table public.vendas is
  'Peças vendidas pelo site. Guardada_ate preenchida = esperando o sinal; vazia = vendida.';

-- Qualquer pessoa vê QUAIS peças estão vendidas ou guardadas (só o código), para o site esconder
alter table public.vendas enable row level security;
drop policy if exists "Vendas públicas" on public.vendas;
create policy "Vendas públicas" on public.vendas
  for select to anon, authenticated
  using (guardada_ate is null or guardada_ate > now());
revoke all on public.vendas from anon, authenticated;
grant select (codigo, guardada_ate) on public.vendas to anon, authenticated;

-- ---------------------------------------------------------------------
-- reservar_itens (da etapa 3), agora também para compras.
-- Uma trava por peça (pg_advisory_xact_lock) evita que dois pedidos ao mesmo
-- tempo passem pela conferência e peguem a mesma peça.
-- ---------------------------------------------------------------------
create or replace function public.reservar_itens(id_do_pedido uuid, itens jsonb, guardar_ate timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  peca text; -- o código da peça da vez
begin
  for item in select value from jsonb_array_elements(itens) loop

    if item ->> 'tipo' = 'compra' then
      peca := item ->> 'codigoBolo';
      perform pg_advisory_xact_lock(hashtext(peca));
      -- já vendida ou guardada para outra compra?
      if exists (
        select 1 from public.vendas v
        where v.codigo = peca and (v.guardada_ate is null or v.guardada_ate > now())
      ) then
        raise exception 'PECA_RESERVADA:%', peca using hint = 'Essa peça já foi vendida ou está guardada para outra compra.';
      end if;
      -- tem aluguel marcado daqui para a frente?
      if exists (
        select 1 from public.reservas r
        where r.codigo = peca and r.devolucao >= current_date
          and (r.guardada_ate is null or r.guardada_ate > now())
      ) then
        raise exception 'PECA_RESERVADA:%', peca using hint = 'Essa peça tem aluguel marcado e não pode ser vendida agora.';
      end if;
      insert into public.vendas (codigo, pedido_id, guardada_ate) values (peca, id_do_pedido, guardar_ate);
      continue;
    end if;

    continue when item ->> 'tipo' <> 'aluguel';

    foreach peca in array array_remove(
      array[item ->> 'codigoBolo', item -> 'topo' ->> 'codigo', item -> 'base' ->> 'codigo'], null
    ) loop
      perform pg_advisory_xact_lock(hashtext(peca));
      -- peça vendida (ou guardada para uma compra) não pode mais ser alugada
      if exists (
        select 1 from public.vendas v
        where v.codigo = peca and (v.guardada_ate is null or v.guardada_ate > now())
      ) then
        raise exception 'PECA_RESERVADA:%', peca using hint = 'Essa peça foi vendida.';
      end if;
      begin
        insert into public.reservas (codigo, festa, origem, pedido_id, guardada_ate)
        values (peca, (item ->> 'festa')::date, 'site', id_do_pedido, guardar_ate);
      exception when exclusion_violation then
        raise exception 'PECA_RESERVADA:%', peca
          using hint = 'Essa peça já está reservada nesse período por outro pedido.';
      end;
    end loop;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Status do pedido (da etapa 3), agora cuidando também das vendas
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
  elsif new.status = 'cancelado' then
    delete from public.reservas where pedido_id = new.id;
    delete from public.vendas where pedido_id = new.id;
    new.guardado_ate := null;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- criar_pedido (da etapa 4a), agora guardando também as compras por 2 horas
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

  -- Solta as reservas e as vendas que venceram sem pagamento, antes de conferir a agenda
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

  return jsonb_build_object('numero', novo.numero, 'guardadoAte', novo.guardado_ate);
end;
$$;

revoke execute on function public.reservar_itens(uuid, jsonb, timestamptz) from public, anon, authenticated;
revoke execute on function public.ao_mudar_status_do_pedido() from public, anon, authenticated;
revoke execute on function public.criar_pedido(jsonb) from public;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;
