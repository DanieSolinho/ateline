-- =====================================================================
-- Ateline · Visualizações dos bolos e números de clientes (aba Relatórios)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Precisa dos arquivos 01 a 07 já rodados. Pode rodar de novo sem problema.
--
-- Visualizações: só conta quantas vezes cada bolo foi aberto por dia.
-- Não guarda nada de quem viu (nem IP, nem conta).
-- =====================================================================

create table if not exists public.visualizacoes (
  codigo text not null,
  dia date not null default current_date,
  total integer not null default 0 check (total >= 0),
  primary key (codigo, dia)
);

alter table public.visualizacoes enable row level security;
revoke all on public.visualizacoes from anon, authenticated; -- só pelas funções abaixo

-- Chamada pela página do bolo (qualquer visitante). Ignora códigos que não são bolos do site.
create or replace function public.registrar_visualizacao(codigo_do_bolo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if codigo_do_bolo !~ '^[A-Z0-9_]{3,40}$' then
    return;
  end if;
  if not exists (select 1 from public.precos where codigo_bolo = codigo_do_bolo and ativo) then
    return;
  end if;
  insert into public.visualizacoes (codigo, dia, total)
  values (codigo_do_bolo, current_date, 1)
  on conflict (codigo, dia) do update set total = public.visualizacoes.total + 1;
end;
$$;

-- Números da aba Relatórios (só a equipe)
--   clientes: pedidos pagos ou concluídos; a mesma pessoa é reconhecida pelo e-mail do pedido
--   visualizacoes: total por bolo nos últimos 30 dias e nos 30 dias anteriores
create or replace function public.dados_de_clientes_e_visualizacoes()
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

  return jsonb_build_object(
    'clientes', coalesce((
      select jsonb_agg(jsonb_build_object('cliente', c.cliente, 'primeiroPedido', c.primeiro, 'pedidos', c.pedidos))
      from (
        select coalesce(nullif(lower(p.cliente ->> 'email'), ''), p.cliente_id::text) as cliente,
               min(p.criado_em) as primeiro,
               count(*) as pedidos
        from public.pedidos p
        where p.status in ('pago', 'concluido')
        group by 1
      ) c
    ), '[]'::jsonb),
    'visualizacoes', coalesce((
      select jsonb_agg(jsonb_build_object('codigo', v.codigo, 'ultimos30', v.ultimos30, 'anteriores30', v.anteriores30))
      from (
        select codigo,
               sum(total) filter (where dia > current_date - 30) as ultimos30,
               sum(total) filter (where dia <= current_date - 30) as anteriores30
        from public.visualizacoes
        where dia > current_date - 60
        group by codigo
      ) v
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.registrar_visualizacao(text) from public;
grant execute on function public.registrar_visualizacao(text) to anon, authenticated;
revoke execute on function public.dados_de_clientes_e_visualizacoes() from public, anon;
grant execute on function public.dados_de_clientes_e_visualizacoes() to authenticated;
