-- =====================================================================
-- Ateline · Etapa 4a: preços no banco
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Precisa dos arquivos 01 a 04 já rodados. Pode rodar de novo sem problema.
--
-- Os preços vêm da planilha: a cada "git push", o GitHub copia os preços de
-- data/catalogo.json para cá (scripts/sincronizar-precos.ts). Não edite à mão.
-- =====================================================================

-- Preço de cada coisa que pode entrar num pedido
create table if not exists public.precos (
  codigo text primary key,                 -- SAFARI_001_3A, TOPO_001, BASE_DOURADA_001
  tipo text not null check (tipo in ('opcao', 'topo', 'base')),
  codigo_bolo text,                        -- só nas opções: de qual bolo é
  preco_locacao numeric(10, 2) not null check (preco_locacao >= 0),
  preco_venda numeric(10, 2) check (preco_venda >= 0), -- null = não está à venda
  ativo boolean not null default true,     -- false = saiu do site (inativo, em manutenção)
  atualizado_em timestamptz not null default now()
);

-- Regras do contrato (as mesmas de lib/regras.ts, também copiadas a cada push)
create table if not exists public.regras (
  chave text primary key,
  valor numeric not null,
  atualizado_em timestamptz not null default now()
);

-- Ninguém lê nem altera pelo site: só o GitHub (com a chave secreta) e o painel do Supabase
alter table public.precos enable row level security;
alter table public.regras enable row level security;
revoke all on public.precos from anon, authenticated;
revoke all on public.regras from anon, authenticated;

-- ---------------------------------------------------------------------
-- Calcula os valores de um pedido com os preços do banco.
-- Devolve {pagoAgora, naRetirada, restanteCompra} ou para com um erro:
--   ITEM_INDISPONIVEL:<codigo> → o item saiu do site ou não existe
--   PRECO_DESATUALIZADO        → o preço de um item não bate com o do banco
--   REGRAS_FALTANDO            → o GitHub ainda não copiou as regras
-- ---------------------------------------------------------------------
create or replace function public.calcular_valores(itens jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  item jsonb;
  taxa numeric;
  sinal numeric;
  preco numeric;
  locacao numeric := 0;
  compras numeric := 0;
  alugueis int := 0;
begin
  select valor into taxa from public.regras where chave = 'TAXA_SEGURANCA';
  select valor into sinal from public.regras where chave = 'PERCENTUAL_SINAL';
  if taxa is null or sinal is null then
    raise exception 'REGRAS_FALTANDO';
  end if;

  for item in select value from jsonb_array_elements(itens) loop
    if item ->> 'tipo' = 'aluguel' then
      -- a opção (tamanho/decoração) precisa ser do bolo escolhido
      select preco_locacao into preco from public.precos
      where codigo = item ->> 'codigoOpcao' and tipo = 'opcao'
        and codigo_bolo = item ->> 'codigoBolo' and ativo;
      if preco is null then
        raise exception 'ITEM_INDISPONIVEL:%', item ->> 'codigoBolo';
      end if;
      if (item ->> 'precoOpcao')::numeric is distinct from preco then
        raise exception 'PRECO_DESATUALIZADO';
      end if;
      locacao := locacao + preco;
      alugueis := alugueis + 1;

      if jsonb_typeof(item -> 'topo') = 'object' then
        select preco_locacao into preco from public.precos
        where codigo = item -> 'topo' ->> 'codigo' and tipo = 'topo' and ativo;
        if preco is null then
          raise exception 'ITEM_INDISPONIVEL:%', item -> 'topo' ->> 'codigo';
        end if;
        if (item -> 'topo' ->> 'preco')::numeric is distinct from preco then
          raise exception 'PRECO_DESATUALIZADO';
        end if;
        locacao := locacao + preco;
      end if;

      if jsonb_typeof(item -> 'base') = 'object' then
        select preco_locacao into preco from public.precos
        where codigo = item -> 'base' ->> 'codigo' and tipo = 'base' and ativo;
        if preco is null then
          raise exception 'ITEM_INDISPONIVEL:%', item -> 'base' ->> 'codigo';
        end if;
        if (item -> 'base' ->> 'preco')::numeric is distinct from preco then
          raise exception 'PRECO_DESATUALIZADO';
        end if;
        locacao := locacao + preco;
      end if;

    elsif item ->> 'tipo' = 'compra' then
      select preco_venda into preco from public.precos
      where codigo = item ->> 'codigoOpcao' and tipo = 'opcao'
        and codigo_bolo = item ->> 'codigoBolo' and ativo;
      if preco is null then
        raise exception 'ITEM_INDISPONIVEL:%', item ->> 'codigoBolo';
      end if;
      if (item ->> 'preco')::numeric is distinct from preco then
        raise exception 'PRECO_DESATUALIZADO';
      end if;
      compras := compras + preco;

    else
      raise exception 'ITEM_INVALIDO';
    end if;
  end loop;

  return jsonb_build_object(
    'pagoAgora', round(locacao * sinal + compras * sinal, 2),
    'naRetirada', round(locacao - locacao * sinal + alugueis * taxa, 2),
    'restanteCompra', round(compras - compras * sinal, 2)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- criar_pedido (da etapa 3), agora conferindo os valores com o banco.
-- Se o site mostrou um valor diferente do banco (planilha mudou e a página
-- estava aberta), o pedido é recusado com PRECO_DESATUALIZADO.
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
    (valores ->> 'pagoAgora')::numeric,
    (valores ->> 'naRetirada')::numeric,
    (valores ->> 'restanteCompra')::numeric
  )
  returning * into novo;

  perform public.reservar_itens(novo.id, novo.itens, prazo);

  return jsonb_build_object('numero', novo.numero, 'guardadoAte', novo.guardado_ate);
end;
$$;

revoke execute on function public.calcular_valores(jsonb) from public, anon, authenticated;
revoke execute on function public.criar_pedido(jsonb) from public;
grant execute on function public.criar_pedido(jsonb) to anon, authenticated;
