-- =====================================================================
-- Ateline · Lista de espera e relatórios do painel
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Precisa dos arquivos 01 a 06 já rodados. Pode rodar de novo sem problema.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Lista de espera: "Me avise se liberar" numa data ocupada
-- ---------------------------------------------------------------------
create table if not exists public.lista_espera (
  id bigint generated always as identity primary key,
  codigo text not null check (codigo ~ '^[A-Z0-9_]+$'), -- o bolo
  festa date not null,
  nome text not null check (char_length(nome) between 2 and 80),
  whatsapp text not null check (whatsapp ~ '^[0-9]{10,11}$'),
  cliente_id uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  avisado_em timestamptz, -- quando a loja avisou que liberou
  unique (codigo, festa, whatsapp) -- a mesma pessoa não entra duas vezes para o mesmo bolo e data
);

-- Dados de clientes: ninguém lê pelo site. Entrar na lista e consultar, só pelas funções abaixo.
alter table public.lista_espera enable row level security;
revoke all on public.lista_espera from anon, authenticated;

-- O site chama esta função no formulário "Me avise se liberar"
create or replace function public.entrar_na_lista_espera(codigo_do_bolo text, data_da_festa date, nome_da_cliente text, whatsapp_da_cliente text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if data_da_festa <= current_date then
    raise exception 'DATA_INVALIDA';
  end if;
  -- no máximo 10 pedidos de aviso por WhatsApp em aberto, para ninguém encher a lista
  if (select count(*) from public.lista_espera
      where whatsapp = whatsapp_da_cliente and avisado_em is null and festa > current_date) >= 10 then
    raise exception 'LIMITE_ESPERA';
  end if;
  insert into public.lista_espera (codigo, festa, nome, whatsapp, cliente_id)
  values (codigo_do_bolo, data_da_festa, trim(nome_da_cliente), whatsapp_da_cliente, auth.uid())
  on conflict (codigo, festa, whatsapp) do nothing;
end;
$$;

-- Para o painel: os pedidos de aviso em aberto, dizendo se a data já liberou
create or replace function public.lista_de_espera()
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
        'id', e.id,
        'codigo', e.codigo,
        'festa', e.festa,
        'nome', e.nome,
        'whatsapp', e.whatsapp,
        'criadoEm', e.criado_em,
        -- liberou = nenhuma reserva valendo cruza o período dessa festa, e a peça não foi vendida
        'liberou', not exists (
          select 1 from public.reservas r
          where r.codigo = e.codigo
            and (r.guardada_ate is null or r.guardada_ate > now())
            and daterange(r.retirada, r.devolucao, '[]')
                && daterange(public.data_de_retirada(e.festa), public.data_de_devolucao(e.festa), '[]')
        ) and not exists (
          select 1 from public.vendas v
          where v.codigo = e.codigo and (v.guardada_ate is null or v.guardada_ate > now())
        )
      )
      order by e.festa, e.criado_em
    )
    from public.lista_espera e
    where e.avisado_em is null and e.festa > current_date
  ), '[]'::jsonb);
end;
$$;

create or replace function public.marcar_espera(id_da_espera bigint, acao text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.e_da_equipe() then
    raise exception 'SO_EQUIPE';
  end if;
  if acao = 'avisado' then
    update public.lista_espera set avisado_em = now() where id = id_da_espera;
  elsif acao = 'remover' then
    delete from public.lista_espera where id = id_da_espera;
  else
    raise exception 'ACAO_INVALIDA';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Relatórios: os dados dos últimos 12 meses, para o painel fazer as contas
--   reservas: cada peça alugada (do site e do WhatsApp) com a data da festa
--   pedidos: pedidos pagos ou concluídos, com os itens e a data
-- ---------------------------------------------------------------------
create or replace function public.dados_do_relatorio()
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
    'reservas', coalesce((
      select jsonb_agg(jsonb_build_object('codigo', r.codigo, 'festa', r.festa, 'origem', r.origem) order by r.festa)
      from public.reservas r
      where r.guardada_ate is null
        and r.festa >= current_date - interval '12 months'
    ), '[]'::jsonb),
    'pedidos', coalesce((
      select jsonb_agg(jsonb_build_object('criadoEm', p.criado_em, 'itens', p.itens) order by p.criado_em)
      from public.pedidos p
      where p.status in ('pago', 'concluido')
        and p.criado_em >= now() - interval '12 months'
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.entrar_na_lista_espera(text, date, text, text) from public;
revoke execute on function public.lista_de_espera() from public, anon;
revoke execute on function public.marcar_espera(bigint, text) from public, anon;
revoke execute on function public.dados_do_relatorio() from public, anon;
grant execute on function public.entrar_na_lista_espera(text, date, text, text) to anon, authenticated;
grant execute on function public.lista_de_espera() to authenticated;
grant execute on function public.marcar_espera(bigint, text) to authenticated;
grant execute on function public.dados_do_relatorio() to authenticated;
